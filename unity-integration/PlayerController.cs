using System.Runtime.InteropServices;
using UnityEngine;

/// <summary>
/// First-person mall walker. F key opens product via JavaScript bridge (no browser URL).
/// Copy to: Assets/Main-Scripts/PlayerController.cs
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    public float walkSpeed = 5f;
    public float runSpeed = 8f;
    public float gravity = -20f;
    public float mouseSensitivity = 2f;

    public Transform cameraTransform;

    CharacterController controller;
    float verticalVelocity;
    float xRotation;

#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void OpenProduct(string productCode);
#endif

    void Start()
    {
        controller = GetComponent<CharacterController>();

        if (cameraTransform == null)
        {
            var cam = GetComponentInChildren<Camera>();
            if (cam != null) cameraTransform = cam.transform;
        }

        if (cameraTransform == null)
        {
            Debug.LogError("[PlayerController] Assign Camera to Player (child) or cameraTransform in Inspector.");
            enabled = false;
            return;
        }

        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    void Update()
    {
        if (cameraTransform == null || controller == null) return;
        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

        transform.Rotate(Vector3.up * mouseX);

        xRotation -= mouseY;
        xRotation = Mathf.Clamp(xRotation, -80f, 80f);
        cameraTransform.localRotation = Quaternion.Euler(xRotation, 0, 0);

        float speed = Input.GetKey(KeyCode.LeftShift) ? runSpeed : walkSpeed;

        float x = Input.GetAxis("Horizontal");
        float z = Input.GetAxis("Vertical");

        Vector3 move = transform.right * x + transform.forward * z;

        verticalVelocity += gravity * Time.deltaTime;
        move.y = verticalVelocity;

        controller.Move(move * speed * Time.deltaTime);

        CheckProduct();
    }

    void CheckProduct()
    {
        Ray ray = new Ray(cameraTransform.position, cameraTransform.forward);

        if (!Physics.Raycast(ray, out RaycastHit hit, 10f))
            return;

        ProductSpot spot = hit.collider.GetComponent<ProductSpot>();
        if (spot == null || string.IsNullOrWhiteSpace(spot.productCode))
            return;

        if (Input.GetKeyDown(KeyCode.F))
        {
            Debug.Log("OPEN PRODUCT: " + spot.productCode);
            SendProductToWebsite(spot.productCode);
        }
    }

    void SendProductToWebsite(string productCode)
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        OpenProduct(productCode);
#else
        Debug.Log("[Editor] Would open product: " + productCode);
#endif
    }
}
