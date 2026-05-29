import os
import numpy as np
import pandas as pd
from scipy.interpolate import interp1d, griddata
import plotly.graph_objects as go
import plotly.io as pio
import io
import base64


# Plotly default font to match your Matplotlib "Times New Roman"
PLOTLY_FONT = dict(family="Times New Roman", size=18, color="black")


# ---------- helper: 3D scene settings ----------
def get_3d_scene():
    # scene properties similar to your set_3Daxis_properties
    scene = dict(
        xaxis=dict(title='Temperature [°C]',
                   range=[900, 1200],
                   tickvals=[900, 1000, 1100, 1200],
                   tickfont=dict(size=15)),
        yaxis=dict(title="Log(Strain rate) [s⁻¹]",
                   range=[-2, 1],
                   tickvals=[-2, -1, 0, 1],
                   tickfont=dict(size=15)),
        zaxis=dict(title='Strain [-]',
                   range=[0.0, 1.0],
                   showticklabels=False,
                   tickfont=dict(size=15)),
        aspectratio=dict(x=25, y=25, z=30),
    )
    return scene


# ---------- core computation + plotting function (migrated) ----------
def PLOT3D(data1, fig, AB, STRAINpick):
    """
    If fig is None and AB is '2D', the function produces a standalone 2D contour HTML file.
    If fig is provided for 'instability' or 'dissipation', the function adds a flat surface
    (z = STRAINpick) colored by the corresponding field to the fig and returns X, Y, Z1.
    If AB == 'collect', returns (dissipation_list, instability_list).
    """

    def find_nearest_idx(array, value):
        array = np.asarray(array)
        idx = np.abs(array - value).argmin()
        return idx

    def Pro(rain_col, stress_col):
        # Robust version of your original "Pro" function:
        # find rows with strain near STRAINpick and pick the nearest one
        if rain_col not in data1.columns or stress_col not in data1.columns:
            raise KeyError(f"Columns {rain_col} or {stress_col} not found in the Excel file.")
        # dropna & use underlying values
        df = data1[[rain_col, stress_col]].dropna()
        # restrict window similar to original: [STRAINpick-0.2, STRAINpick+0.02]
        mask = (df[rain_col] >= STRAINpick - 0.2) & (df[rain_col] <= STRAINpick + 0.02)
        candidates = df.loc[mask]
        if candidates.empty:
            # fallback: use overall nearest in the whole column
            nearest_idx = find_nearest_idx(df[rain_col].values, STRAINpick)
            chosen = df.iloc[nearest_idx]
        else:
            # choose nearest among candidates
            nearest_idx = (np.abs(candidates[rain_col] - STRAINpick)).idxmin()
            chosen = df.loc[nearest_idx]

        # return log10 of stress
        return np.log10(float(chosen[stress_col]))

    def numerical_diff(f, x):
        h = 1e-4
        return (f(x + h) - f(x - h)) / (2 * h)

    def interpolated_tangent(TEM, x):
        fq = interp1d(LOG10SR, TEM, kind='cubic', fill_value="extrapolate")
        return numerical_diff(fq, x)

    # replicate your exact computations
    LOG10SR = np.log10(np.array([0.01, 0.1, 1, 10]))
    TEMPERATURE = np.array([900, 1000, 1100, 1200])

    TEMPERATURE1200 = [Pro('strain1', 'stress1'), Pro('strain5', 'stress5'),
                       Pro('strain9', 'stress9'), Pro('strain13', 'stress13')]
    TEMPERATURE1100 = [Pro('strain2', 'stress2'), Pro('strain6', 'stress6'),
                       Pro('strain10', 'stress10'), Pro('strain14', 'stress14')]
    TEMPERATURE1000 = [Pro('strain3', 'stress3'), Pro('strain7', 'stress7'),
                       Pro('strain11', 'stress11'), Pro('strain15', 'stress15')]
    TEMPERATURE900 = [Pro('strain4', 'stress4'), Pro('strain8', 'stress8'),
                      Pro('strain12', 'stress12'), Pro('strain16', 'stress16')]

    TEMPERATURES = [TEMPERATURE1200, TEMPERATURE1100, TEMPERATURE1000, TEMPERATURE900]
    values = [-1.9999, -1, 0, 0.9999]

    # interpolated tangents (tf_values)
    tf_values = [interpolated_tangent(temp, val) for temp in TEMPERATURES for val in values]
    tf_values = [max(tf, 1e-6) for tf in tf_values]  # same adjust as original
    dissipation_value = [(2 * tf) / (tf + 1) for tf in tf_values]
    LN_m_values = [np.log10(tf / (tf + 1)) for tf in tf_values]
    L_values = [LN_m_values[i * 4:(i + 1) * 4] for i in range(4)]
    instability_value = [interpolated_tangent(L_values[i], values[j]) + tf_values[i * 4 + j]
                         for i in range(4) for j in range(4)]
    Jun_value = [2 * tf / dv - 1.1 for tf, dv in zip(tf_values, dissipation_value)]

    # x,y positions for griddata (16 points)
    x = [TEMPERATURE[3]] * 4 + [TEMPERATURE[2]] * 4 + [TEMPERATURE[1]] * 4 + [TEMPERATURE[0]] * 4
    y = list(LOG10SR) * 4

    # interpolation grid
    xi = np.linspace(TEMPERATURE[0], TEMPERATURE[3], 50)
    yi = np.linspace(LOG10SR[0], LOG10SR[3], 50)
    X, Y = np.meshgrid(xi, yi)

    # generate 2D fields
    Z = griddata((x, y), dissipation_value, (X, Y), method='cubic')
    Z1 = griddata((x, y), instability_value, (X, Y), method='cubic')
    Z3 = griddata((x, y), Jun_value, (X, Y), method='cubic')

    if AB == 'collect':
        # return lists for further graphing
        return dissipation_value, instability_value

    # If fig is None and AB is 'instability' or 'dissipation', create a new figure
    if fig is None and AB in ('instability', 'dissipation'):
        fig = go.Figure()
        fig.update_layout(title=f"Strain {STRAINpick:.3f}", font=PLOTLY_FONT)

    if AB == 'instability':
        # create a flat surface at z = STRAINpick, color by Z1, but only show Z1 <= 0 region
        mask = np.where(Z1 <= 0, Z1, np.nan)  # keep negative/zero values, else NaN -> hole
        zplane = np.full_like(Z1, STRAINpick)
        trace = go.Surface(
            x=xi, y=yi, z=zplane, surfacecolor=mask,
            colorscale='Reds', opacity=0.28, showscale=False,
            hovertemplate="Temp=%{x}<br>LogSR=%{y}<br>Z1=%{surfacecolor}<extra></extra>"
        )
        fig.add_trace(trace)
        fig.update_layout(scene=get_3d_scene(), title=f"Instability contours at strain {STRAINpick:.3f}", font=PLOTLY_FONT)
        return fig, X, Y, Z1  # return fig plus arrays for overlaying particle data

    elif AB == 'dissipation':
        # show dissipation levels on a flat plane; limit colorbar to [0.3,0.5] to mimic your contour levels
        zplane = np.full_like(Z, STRAINpick)
        trace = go.Surface(
            x=xi, y=yi, z=zplane, surfacecolor=Z,
            colorscale='Jet', opacity=0.30, showscale=True,
            cmin=0.3, cmax=0.5,
            colorbar=dict(title="Dissipation"),
            hovertemplate="Temp=%{x}<br>LogSR=%{y}<br>Diss=%{surfacecolor}<extra></extra>"
        )
        fig.add_trace(trace)
        fig.update_layout(scene=get_3d_scene(), title=f"Dissipation at strain {STRAINpick:.3f}", font=PLOTLY_FONT)
        return fig, X, Y, Z  # return fig plus arrays

    elif AB == '2D':
        # produce 2D contour plot (two layers: dissipation contour + grey-filled instability region)
        fig2 = go.Figure()
        # main dissipation contours (levels ~ 0.1..0.95 with step 0.05)
        c1 = go.Contour(
            x=xi, y=yi, z=Z,
            contours=dict(start=0.1, end=0.95, size=0.05),
            colorscale='Jet',
            colorbar=dict(title='Dissipation'),
            hovertemplate="Temp=%{x}<br>LogSR=%{y}<br>Diss=%{z}<extra></extra>"
        )
        # grey-filled areas where instability <= 0 (mask)
        mask = np.where(Z1 <= 0, 0.0, np.nan)
        c2 = go.Contour(
            x=xi, y=yi, z=mask,
            contours=dict(showlines=False),
            colorscale=[[0, 'rgba(128,128,128,0.5)'], [1, 'rgba(128,128,128,0.5)']],
            showscale=False,
            hoverinfo='skip'
        )
        fig2.add_trace(c1)
        fig2.add_trace(c2)
        fig2.update_layout(title=f"Strain {round(STRAINpick, 1)}", xaxis_title='Temperature [°C]',
                           yaxis_title='Log(Strain rate) [s⁻¹]', font=PLOTLY_FONT)
        # write HTML and open in browser (like plt.show())
        #filename = f"2D_strain_{STRAINpick:.3f}.html"
        #fig2.write_html(filename, auto_open=True)
        return fig2

    else:
        raise ValueError("AB should be one of: 'instability', 'dissipation', '2D', or 'collect'.")


# ---------- particle-data loaders & plotters (migrated) ----------
def Simufact_particles_load_simufact_data(temp_path, sr_path, s_path):
    Temperature_simufact = pd.read_csv(temp_path, encoding='cp949', skiprows=0, sep=';').iloc[:, 1::4]
    Strainrate_simufact = pd.read_csv(sr_path, encoding='cp949', skiprows=0, sep=';').iloc[:, 1::4]
    Strain_simufact = pd.read_csv(s_path, encoding='cp949', skiprows=0, sep=';').iloc[:, 1::4]

    data_frames = []
    for i in range(Temperature_simufact.shape[1]):
        combined_data = pd.concat([Temperature_simufact.iloc[:, i],
                                   Strainrate_simufact.iloc[:, i],
                                   Strain_simufact.iloc[:, i]], axis=1).to_numpy().astype(float)
        valid_data = combined_data[np.all(combined_data > 0.01, axis=1)]
        data_frames.append(valid_data)
    return data_frames


def Simufact_particles_plot_simufact_data(fig, data_frames, selected_indices):
    for idx, data in enumerate(data_frames):
        if idx not in selected_indices:
            continue

        x = data[:, 0].astype(float) - 50  # temperature adjustment as original
        y = np.log10(data[:, 1].astype(float)) / 10  # keep your original scaling
        z = data[:, 2].astype(float)

        # line
        fig.add_trace(go.Scatter3d(x=x, y=y, z=z, mode='lines',
                                   line=dict(width=1),
                                   name=f"SimLine_{idx}"))
        # markers
        fig.add_trace(go.Scatter3d(x=x, y=y, z=z, mode='markers',
                                   marker=dict(size=1),
                                   name=f"SimPts_{idx}"))


# Deform loader uses your DATFILE_INPUT1 logic
def Deform_particles_data_load(temp_path, strain_path, sr_path, start, end):
    def DATFILE_INPUT1(filepath, w, e):
        interesting = []
        with open(filepath) as fi:
            # original read from line 5 onward (index 4)
            for line in fi.readlines()[4:1500]:
                parts = line.split()
                if len(parts) >= (e):
                    interesting.append(float(parts[w:e][0]))
        return interesting

    data_frames = []
    for i in range(start, end + 1):
        x = np.array(DATFILE_INPUT1(temp_path, i, i + 1))
        y = np.log10(np.array(DATFILE_INPUT1(sr_path, i, i + 1)))
        z = np.array(DATFILE_INPUT1(strain_path, i, i + 1))

        # Filtering conditions: temperature 750..1200 ; logSR >= -2 ; strain <= 1
        mask = (x >= 750) & (x <= 1200) & (y >= -2) & (z <= 1)
        if np.any(mask):
            data_frames.append((x[mask], y[mask], z[mask]))

    return data_frames


def Deform_particles_data_plot(fig, data_frames, X, Y, instability_values):
    color_order = ['red', 'orange', 'yellow', 'green', 'blue', 'navy', 'violet']
    color_index = 0
    red_instability_values = []

    for frame in data_frames:
        x, y, z = frame
        scatter_colors = []
        for xi_val, yi_val, zi_val in zip(x, y, z):
            nearest_strain = min(instability_values.keys(), key=lambda k: abs(k - zi_val))
            Z1 = instability_values[nearest_strain]
            try:
                instability_at_point = griddata((X.flatten(), Y.flatten()), Z1.flatten(), (xi_val, yi_val), method='cubic')
            except Exception:
                instability_at_point = np.nan
            if np.isnan(instability_at_point):
                # if interpolation failed, mark black (safe)
                scatter_colors.append('black')
            else:
                if instability_at_point <= 0:
                    scatter_colors.append('red')
                    red_instability_values.append(float(instability_at_point))
                else:
                    scatter_colors.append('black')

        # line
        line_color = color_order[color_index % len(color_order)]
        fig.add_trace(go.Scatter3d(x=x.flatten(), y=y.flatten(), z=z.flatten(),
                                   mode='lines', line=dict(color=line_color, width=2),
                                   name=f"Deform_line_{color_index}"))
        # scatter
        fig.add_trace(go.Scatter3d(x=x.flatten(), y=y.flatten(), z=z.flatten(),
                                   mode='markers', marker=dict(color=scatter_colors, size=3),
                                   name=f"Deform_pts_{color_index}"))
        color_index += 1

    negative_sum = -np.sum(red_instability_values) if red_instability_values else 0.0
    number_ins = len(red_instability_values)
    # add annotation (2D overlay) similar to ax.text2D
    txt = f"Sum of Instability: {negative_sum:.2f}<br>Number of Instability: {number_ins:d}"
    fig.add_annotation(x=0.02, y=0.98, xref='paper', yref='paper', text=txt, showarrow=False,
                       bgcolor='rgba(255,255,255,0.7)', font=dict(size=14))


# ---------- higher-level draw_selected_data ----------
def draw_selected_data(fig, data_types, folders, X, Y, instability_values):


    # Simufact
    if any((d is not None and "Simufact_particles_" in d) for d in data_types):
        try:
            if "simufact" not in folders:
                raise ValueError("Simufact folder not provided in folders dict")

            sim_path = folders["simufact"]  # temp folder path
            sim_data = Simufact_particles_load_simufact_data(
                os.path.join(sim_path, "t.csv"),
                os.path.join(sim_path, "sr.csv"),
                os.path.join(sim_path, "s.csv"),
            )

            print("Comes here")
            Simufact_particles_plot_simufact_data(
                fig, sim_data, [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
            )
        except Exception as e:
            print("Simufact load/plot failed:", e)

    # DEFORM
    if any((d is not None and "DEFORM_particles_" in d) for d in data_types):
        try:
            if "deform" not in folders:
                raise ValueError("Deform folder not provided in folders dict")

            deform_path = folders["deform"]  # temp folder path
            deform_frames = Deform_particles_data_load(
                os.path.join(deform_path, "t.dat"),
                os.path.join(deform_path, "s.dat"),
                os.path.join(deform_path, "sr.dat"),
                1,
                9,
            )

            print("Comes here2")
            Deform_particles_data_plot(fig, deform_frames, X, Y, instability_values)
        except Exception as e:
            print("Deform load/plot failed:", e)


# ---------- main_graph (migrated) ----------
def main_graph(data1, plot_type, selected_data, folders, steps):
    """
    plot_type: '2D', 'instability', 'dissipation'
    selected_data: list of strings that may include 'Simufact_particles_' or 'DEFORM_particles_'
    steps: step size for strain sweep
    """


    print(data1, plot_type, selected_data, folders, steps)

    if plot_type == '2D':
        # produce many 2D HTML contour files (one per strain)

        return [PLOT3D(data1, None, '2D', steps).to_dict()]

    elif plot_type in ['instability', 'dissipation']:
        # create new fig and add a surface for each strain slice
        fig = go.Figure()
        instability_values = {}
        X_global, Y_global = None, None

        for s in np.arange(0.1, 1.01, steps):
            result = PLOT3D(data1, fig, plot_type, s)
            # PLOT3D returns (fig, X, Y, field) for instability and (fig, X, Y, Z) for dissipation
            if isinstance(result, tuple) and len(result) >= 4:
                fig, X, Y, field = result
                instability_values[round(s, 6)] = field
                X_global, Y_global = X, Y  # keep the last X,Y for particle overlays

        # final layout
        fig.update_layout(scene=get_3d_scene(), title=f"{plot_type.capitalize()} surfaces ({plot_type})", font=PLOTLY_FONT)
        # draw selected particles
        draw_selected_data(fig, selected_data, folders, X_global, Y_global, instability_values)

        # write HTML and open
        # fname = f"{plot_type}_3d_summary.html"
        # fig.write_html(fname, auto_open=True)

        return [fig.to_dict()]

    else:
        raise ValueError("Type should be either 'instability', 'dissipation' or '2D'.")


# ---------- collecting & plotting values vs strain (migrated to Plotly) ----------
def collect_values_for_strain(data1, steps):
    strain_values = np.arange(0.1, 1.01, steps)
    LOG10SR = np.log10(np.array([0.01, 0.1, 1, 10]))
    instability_data = {}
    dissipation_data = {}

    for strain in strain_values:
        dissipations, instabilities = PLOT3D(data1, None, 'collect', strain)
        for idx, temperature in enumerate(['1200', '1100', '1000', '900']):
            for j, logsr in enumerate(LOG10SR):
                key = f"{temperature}-{logsr}"
                instability_data.setdefault(key, []).append(instabilities[idx * 4 + j])
                dissipation_data.setdefault(key, []).append(dissipations[idx * 4 + j])

    return strain_values, instability_data, dissipation_data

def collect_values_for_strain_api (data1, steps): 
    strain_values = np.arange(0.1, 1.01, steps)
    LOG10SR = np.log10(np.array([0.01, 0.1, 1, 10]))
    instability_data = {}
    dissipation_data = {}

    for strain in strain_values:
        dissipations, instabilities = PLOT3D(data1, None, 'collect', strain)
        for idx, temperature in enumerate(['1200', '1100', '1000', '900']):
            for j, logsr in enumerate(LOG10SR):
                key = f"{temperature}-{logsr}"
                instability_data.setdefault(key, []).append(instabilities[idx * 4 + j])
                dissipation_data.setdefault(key, []).append(dissipations[idx * 4 + j])

    # Convert results to a DataFrame for Excel
    df_instability = pd.DataFrame(instability_data, index=strain_values)
    df_instability.index.name = "Strain"

    df_dissipation = pd.DataFrame(dissipation_data, index=strain_values)
    df_dissipation.index.name = "Strain"

    # Write both tables to separate sheets in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        df_instability.to_excel(writer, sheet_name="Instability")
        df_dissipation.to_excel(writer, sheet_name="Dissipation")

    # Get the binary content
    excel_bytes = output.getvalue()

    # Base64 encode
    encoded_excel = base64.b64encode(excel_bytes).decode("utf-8")

    return encoded_excel


def plot_values_against_strain(data1, steps, value, plot_by="temperature", value_type="instability"):
    strain_values, instability_data, dissipation_data = collect_values_for_strain(data1, steps)

    print(steps, value, plot_by, value_type)

    if value_type == "instability":
        data = instability_data
        ylabel = 'Flow instability'
        ylim = [-0.4, 1]
    elif value_type == "dissipation":
        data = dissipation_data
        ylabel = 'Power dissipation'
        ylim = [0, 0.5]
    else:
        raise ValueError("Invalid 'value_type' parameter. Choose 'instability' or 'dissipation'.")

    temperatures = ['1200', '1100', '1000', '900']
    LOG10SR_values = np.log10(np.array([0.01, 0.1, 1, 10]))
    line_styles = ['solid', 'dash', 'dot', 'dashdot']
    markers = ['circle', 'x', 'cross', 'square']

    if plot_by == "temperature":
        # create one HTML per temperature (like your original per-temperature plt.show)
        temp = value
        fig = go.Figure()
        # pick keys that correspond to this temperature
        temp_keys = [k for k in data.keys() if k.startswith(temp + '-')]
        for idx, key in enumerate(sorted(temp_keys)):
            values = data[key]
            fig.add_trace(go.Scatter(x=strain_values, y=values,
                                        mode='lines+markers',
                                        line=dict(dash=line_styles[idx % len(line_styles)], color='black'),
                                        marker=dict(symbol=markers[idx % len(markers)]),
                                        name=f"Log(ε̇)={key.split('-')[-1]}"))
        fig.update_layout(title=f"{temp}°C", xaxis_title='Strain', yaxis_title=ylabel, font=PLOTLY_FONT)
        # add instability zero line if needed
        if value_type == "instability":
            fig.add_hline(y=0, line=dict(color='black', width=1), opacity=0.2)
        # fname = f"{temp}_{value_type}.html"
        # fig.write_html(fname, auto_open=True)

        return [fig.to_dict()]

    elif plot_by == "LOG10SR":
        logsr = np.log10(float(value))
        fig = go.Figure()
        for j, temperature in enumerate(temperatures):
            key = f"{temperature}-{logsr}"
            vals = data[key]
            fig.add_trace(go.Scatter(x=strain_values, y=vals,
                                        mode='lines+markers',
                                        line=dict(dash=line_styles[j % len(line_styles)], color='black'),
                                        marker=dict(symbol=markers[j % len(markers)]),
                                        name=f'{temperature}°C'))
        fig.update_layout(title=f'Log(ε̇)={logsr}', xaxis_title='Strain', yaxis_title=ylabel, font=PLOTLY_FONT)
        if value_type == "instability":
            fig.add_hline(y=0, line=dict(color='black', width=1), opacity=0.2)
        # fname = f"LOG10SR_{logsr}_{value_type}.html".replace('.', '_')
        # fig.write_html(fname, auto_open=True)

        return [fig.to_dict()]

    else:
        raise ValueError("Invalid 'plot_by' parameter. Choose 'temperature' or 'LOG10SR'.")


# # ---------- sample usages (same sequence as your original script) ----------
# if __name__ == "__main__":
#     path_file = os.getcwd()
#     fn = '_RAW_Processing map_AISI4340.xlsx'   # same filename as your original script
#     sn = 'Sheet1'
#     data1 = pd.read_excel(os.path.join(path_file, fn), sheet_name=sn)

#     # NOTE: these will generate and auto-open several HTML files (interactive Plotly)
#     main_graph(data1, 'instability', [None], 0.05)
#     main_graph('dissipation', [None], 0.1)

#     # overlay deform / simufact datasets (if files exist)
#     main_graph('instability', ['DEFORM_particles_'], 0.1)
#     main_graph('instability', ['Simufact_particles_'], 0.05)
#     main_graph('dissipation', ['Simufact_particles_'], 0.05)

#     # produce 2D contour HTML files for each strain
#     main_graph('2D', [None], 0.1)

#     # plots vs strain
#     plot_values_against_strain(0.1, plot_by="temperature", value_type="instability")
#     plot_values_against_strain(0.1, plot_by="LOG10SR", value_type="instability")
#     plot_values_against_strain(0.1, plot_by="LOG10SR", value_type="dissipation")
