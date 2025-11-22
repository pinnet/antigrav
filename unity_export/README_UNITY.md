# Unity 6 Project Setup Guide

Follow these steps to recreate the 3D Rotating Cube project in Unity 6.

## 1. Project Initialization
1.  Open **Unity Hub** and create a new **3D Core** project using **Unity 6** (or 2023.x/2022.x).
2.  Name it `RotatingCube`.

## 2. Import Scripts
1.  In the **Project** window, right-click `Assets` -> `Create` -> `Folder`, name it `Scripts`.
2.  Copy the 3 generated scripts (`CubeManager.cs`, `TileBehavior.cs`, `CameraControl.cs`) into this folder.

## 3. Import TextMeshPro
1.  Go to `Window` -> `TextMeshPro` -> `Import TMP Essential Resources`.
2.  Click `Import` in the popup.

## 4. Create the Tile Prefab
This is the most critical step.
1.  Right-click in Hierarchy -> `3D Object` -> `Cube`. Name it `Tile`.
2.  Set its Scale to `(1, 1, 1)`.
3.  **Create Faces**:
    - We need 6 separate text objects for the faces.
    - Right-click `Tile` -> `3D Object` -> `Text - TextMeshPro`. Name it `Face_Right`.
    - Configure `Face_Right`:
        - **Rect Transform**: Pos `(0.51, 0, 0)`, Rotation `(0, 90, 0)`, Width/Height `(1, 1)`.
        - **TextMeshPro**: Font Size `6`, Alignment `Center/Middle`, Text "A".
    - Duplicate `Face_Right` 5 times and rename/configure:
        - `Face_Left`: Pos `(-0.51, 0, 0)`, Rot `(0, -90, 0)`.
        - `Face_Top`: Pos `(0, 0.51, 0)`, Rot `(-90, 0, 0)`.
        - `Face_Bottom`: Pos `(0, -0.51, 0)`, Rot `(90, 0, 0)`.
        - `Face_Front`: Pos `(0, 0, 0.51)`, Rot `(0, 0, 0)`.
        - `Face_Back`: Pos `(0, 0, -0.51)`, Rot `(0, 180, 0)`.
4.  **Add Script**:
    - Add the `TileBehavior` script to the `Tile` object.
    - In the Inspector, locate the `Faces` and `Face Texts` arrays.
    - Set Size to `6`.
    - Drag the Face objects (`Face_Right`, `Face_Left`, etc.) into the `Faces` array in the order: **Right, Left, Top, Bottom, Front, Back**.
    - Drag the same objects (or their TMP components) into the `Face Texts` array.
5.  **Prefab**: Drag the `Tile` object from Hierarchy to the `Assets` folder to create a Prefab. Delete it from the scene.

## 5. Setup the Scene
1.  Create an Empty GameObject, name it `Manager`.
    - Add `CubeManager` script.
    - Assign the `Tile` prefab to the `Tile Prefab` slot.
2.  Select the `Main Camera`.
    - Add `CameraControl` script.
    - Create an Empty GameObject at `(0,0,0)`, name it `CenterTarget`.
    - Assign `CenterTarget` to the `Target` slot in `CameraControl`.
3.  Link Camera to Manager:
    - Select `Manager`.
    - Drag `Main Camera` (with CameraControl) to the `Camera Control` slot.

## 6. Lighting & Environment
1.  Open `Window` -> `Rendering` -> `Lighting`.
2.  Set `Environment Lighting` Source to `Color` (Dark Grey) for that "Dark Mode" look.
3.  Add a `Directional Light` if not present.
4.  Enable `Fog` in Lighting settings (Density 0.02, Color Dark Grey).

## 7. Run
Press **Play**. You should see the cube generated.
- Use **Mouse Drag** to rotate.
- Use **Scroll Wheel** to zoom.
- Change `Grid Size` in the `Manager` inspector to resize (changes apply on next Play or if you add a button to call `GenerateCube`).

## Troubleshooting
- **Pink Materials**: Ensure you are using the Standard Render Pipeline or upgrade materials if using URP/HDRP.
- **Text Not Visible**: Check the Z-offset (0.51) to ensure it sits slightly above the cube surface.
