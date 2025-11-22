using UnityEngine;
using TMPro;

public class TileBehavior : MonoBehaviour
{
    [Header("Configuration")]
    public MeshRenderer cubeRenderer;
    // Assign these in the prefab to the 6 text objects positioned on the faces
    // Order: Right(+X), Left(-X), Top(+Y), Bottom(-Y), Front(+Z), Back(-Z)
    public Transform[] faces; 
    public TextMeshPro[] faceTexts;

    private bool _hasLetter = false;
    private CubeManager _manager;
    private Color _originalColor;
    
    private const string LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public void Initialize(Color color, CubeManager manager)
    {
        _manager = manager;
        _originalColor = color;
        
        if (cubeRenderer != null)
        {
            cubeRenderer.material.color = color;
        }

        // Hide texts initially
        foreach (var txt in faceTexts)
        {
            if (txt != null) txt.text = "";
        }
    }

    private void Update()
    {
        // Random Letter Spawning
        if (!_hasLetter && Random.value < _manager.letterSpeed * Time.deltaTime)
        {
            SpawnLetter();
        }

        if (_hasLetter)
        {
            UpdateFaceOrientations();
        }
    }

    private void SpawnLetter()
    {
        _hasLetter = true;
        char letter = LETTERS[Random.Range(0, LETTERS.Length)];
        
        foreach (var txt in faceTexts)
        {
            if (txt != null) txt.text = letter.ToString();
        }
        
        // Optional: Change material to white or keep color? 
        // The prompt implied the tile keeps its color but the letter appears.
        // In Unity, TMP sits on top, so we keep the background color.
    }

    private void UpdateFaceOrientations()
    {
        if (Camera.main == null) return;

        Vector3 cameraUp = Camera.main.transform.up;

        // Iterate through all 6 faces
        for (int i = 0; i < faces.Length; i++)
        {
            Transform face = faces[i];
            if (face == null) continue;

            // We want to rotate the TEXT (which is a child of the face, or the face itself)
            // so that its local UP aligns with the projected camera UP.
            
            // Get Face Normal (World Space)
            // Assuming the faces are oriented such that their forward vector points out of the cube
            Vector3 faceNormal = face.forward;

            // Project Camera Up onto the face plane
            // Vector3.ProjectOnPlane(vector, planeNormal)
            Vector3 projectedUp = Vector3.ProjectOnPlane(cameraUp, faceNormal).normalized;

            if (projectedUp.sqrMagnitude > 0.001f)
            {
                // Calculate the angle between the Face's "natural" up (local Y in world space) and the projected up
                // However, since we are rotating the object itself, we can just use LookRotation.
                // We want the Text's UP to be 'projectedUp'.
                // We want the Text's FORWARD to be 'faceNormal' (to stay flat on the surface).
                
                Quaternion targetRotation = Quaternion.LookRotation(faceNormal, projectedUp);

                // Convert to local rotation relative to the parent (the tile) is tricky because the parent rotates.
                // Easier to work in local space of the face.
                
                // Let's calculate the angle in the plane defined by faceNormal.
                // Local Up of the face (before rotation logic)
                // We need a reference "Up" for the face. 
                // Let's assume the face object is initially oriented with Z out, Y up.
                
                // Actually, simpler approach:
                // 1. Orient the face to look at normal, with up = projectedUp.
                // 2. Snap the Roll (Z-rotation in local space of the face).
                
                // But LookRotation might flip things.
                
                // Let's try calculating the angle between the face's current local Y (in world space) and the projected Up.
                // But we are changing the rotation every frame, so "current" changes.
                // We need the "Base" Up of the face.
                
                // Let's assume the face is a child.
                // We want to set its rotation.
                
                Quaternion idealRotation = Quaternion.LookRotation(faceNormal, projectedUp);
                
                // Snap to 90 degrees
                // Get the Z-rotation (roll) of this ideal rotation relative to some basis?
                // No, we want to snap the orientation of the text around the face normal.
                
                // Let's convert the ideal rotation to local space of the TILE.
                Quaternion localIdeal = Quaternion.Inverse(transform.rotation) * idealRotation;
                
                // Now we want to snap this local rotation's "Roll" around the local Z axis (assuming Z is normal in local space).
                // This depends on how the faces are set up in the prefab.
                // Let's assume in the prefab:
                // Top Face: Pos (0, 0.5, 0), Rot (-90, 0, 0) -> Local Z points Up (World Y).
                
                // This is getting complex to generalize without knowing the exact prefab setup.
                // Let's use a simpler heuristic that works visually:
                // Set the rotation to ideal, then find the nearest 90-degree snap relative to the camera up?
                
                // Alternative:
                // Just set rotation to ideal.
                face.rotation = idealRotation;
                
                // Now snap the local Z rotation (Roll) of the face?
                // Since LookRotation aligns Y with projectedUp, we are already "upright".
                // To snap to 90 degrees relative to the "Grid", we need to snap the angle between projectedUp and... what?
                // The Camera Up is arbitrary.
                
                // The requirement is "Constrain the letters to keep to a 90-degree orientation".
                // This usually means 90 degrees relative to the TILE's local axes.
                
                // 1. Get Camera Up in Tile Local Space.
                Vector3 localCamUp = transform.InverseTransformDirection(cameraUp);
                
                // 2. Project onto the local face plane.
                // We need to know which local axis is the normal for this face.
                // Let's assume we iterate and know the local normal.
                Vector3 localNormal = transform.InverseTransformDirection(faceNormal);
                
                Vector3 localProjectedUp = Vector3.ProjectOnPlane(localCamUp, localNormal).normalized;
                
                // 3. Calculate angle relative to the face's "Base" Up in local space.
                // We need to define what "Up" is for each face in local space.
                // Right Face (+X): Normal=(1,0,0), Up=(0,1,0)?
                
                Vector3 baseUp = GetBaseUpForFace(i); // Helper method
                
                float angle = Vector3.SignedAngle(baseUp, localProjectedUp, localNormal);
                
                // 4. Snap angle
                float snapAngle = Mathf.Round(angle / 90f) * 90f;
                
                // 5. Apply rotation
                // We want to rotate the face child so its Up aligns with baseUp rotated by snapAngle.
                Quaternion snapRot = Quaternion.AngleAxis(snapAngle, localNormal);
                
                // We also need to align the face normal.
                // The face child should be oriented such that its forward is localNormal, and its Up is baseUp.
                Quaternion baseOrientation = Quaternion.LookRotation(localNormal, baseUp);
                
                face.localRotation = snapRot * baseOrientation;
            }
        }
    }

    private Vector3 GetBaseUpForFace(int index)
    {
        // 0: Right(+X), 1: Left(-X), 2: Top(+Y), 3: Bottom(-Y), 4: Front(+Z), 5: Back(-Z)
        switch (index)
        {
            case 0: return Vector3.up;    // Right -> Up is Y
            case 1: return Vector3.up;    // Left -> Up is Y
            case 2: return Vector3.forward; // Top -> Up is Z? Or -Z? Let's pick Z.
            case 3: return Vector3.forward; // Bottom -> Up is Z
            case 4: return Vector3.up;    // Front -> Up is Y
            case 5: return Vector3.up;    // Back -> Up is Y
            default: return Vector3.up;
        }
    }
}
