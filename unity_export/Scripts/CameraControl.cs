using UnityEngine;

public class CameraControl : MonoBehaviour
{
    public Transform target;
    public float distance = 10f;
    public float sensitivity = 5f;
    public float zoomSpeed = 2f;
    public float minDistance = 2f;
    public float maxDistance = 50f;

    private float _currentX = 0f;
    private float _currentY = 0f;

    private void Update()
    {
        // Mouse Rotation (Left Click)
        if (Input.GetMouseButton(0))
        {
            _currentX += Input.GetAxis("Mouse X") * sensitivity;
            _currentY -= Input.GetAxis("Mouse Y") * sensitivity;
        }

        // Zoom (Scroll Wheel)
        distance -= Input.GetAxis("Mouse ScrollWheel") * zoomSpeed;
        distance = Mathf.Clamp(distance, minDistance, maxDistance);
    }

    private void LateUpdate()
    {
        if (target == null) return;

        // Arcball-ish rotation
        Quaternion rotation = Quaternion.Euler(_currentY, _currentX, 0);
        Vector3 direction = new Vector3(0, 0, -distance);
        transform.position = target.position + rotation * direction;
        transform.LookAt(target.position);
    }

    public void FitToTarget(float size)
    {
        // Simple fit calculation
        float fov = Camera.main.fieldOfView;
        float fitDist = size / (2f * Mathf.Tan(0.5f * fov * Mathf.Deg2Rad));
        distance = fitDist * 1.5f; // Add some padding
    }
}
