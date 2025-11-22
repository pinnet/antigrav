using UnityEngine;
using System.Collections.Generic;

public class CubeManager : MonoBehaviour
{
    [Header("Settings")]
    [Range(5, 25)]
    public int gridSize = 5;
    public float gap = 0.05f;
    [Range(0f, 1f)]
    public float letterSpeed = 0.01f; // Chance per frame to spawn a letter

    [Header("References")]
    public GameObject tilePrefab;
    public CameraControl cameraControl;

    private List<GameObject> _tiles = new List<GameObject>();
    private Transform _container;

    private void Start()
    {
        _container = new GameObject("CubeContainer").transform;
        _container.SetParent(transform);
        GenerateCube();
    }

    public void GenerateCube()
    {
        // Enforce odd number
        if (gridSize % 2 == 0) gridSize++;

        // Clear existing
        foreach (var tile in _tiles)
        {
            if (tile != null) Destroy(tile);
        }
        _tiles.Clear();

        float size = 1f; // Assumed tile size
        float offset = (gridSize - 1) / 2f;
        float spacing = size + gap;

        for (int x = 0; x < gridSize; x++)
        {
            for (int y = 0; y < gridSize; y++)
            {
                for (int z = 0; z < gridSize; z++)
                {
                    Vector3 pos = new Vector3(
                        (x - offset) * spacing,
                        (y - offset) * spacing,
                        (z - offset) * spacing
                    );

                    GameObject tile = Instantiate(tilePrefab, _container);
                    tile.transform.localPosition = pos;
                    
                    // Random Color
                    Color randomColor = Random.ColorHSV(0f, 1f, 0.8f, 0.8f, 0.5f, 0.5f);
                    
                    var behavior = tile.GetComponent<TileBehavior>();
                    if (behavior != null)
                    {
                        behavior.Initialize(randomColor, this);
                    }

                    _tiles.Add(tile);
                }
            }
        }

        // Update Camera
        if (cameraControl != null)
        {
            float totalSize = gridSize * spacing;
            cameraControl.FitToTarget(totalSize);
        }
    }

    public void RegenerateColors()
    {
        GenerateCube();
    }

    private void OnValidate()
    {
        if (gridSize % 2 == 0) gridSize++;
    }
}
