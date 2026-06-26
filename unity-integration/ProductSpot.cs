using UnityEngine;

/// <summary>
/// Attach to poster / product collider in Unity scene.
/// productCode must match MongoDB Product.productId (e.g. MEN-TROUSER-SHIRT-002).
/// Copy to: Assets/Main-Scripts/ProductSpot.cs
/// </summary>
public class ProductSpot : MonoBehaviour
{
    [Tooltip("Same code as FashionVerse DB field: productId")]
    public string productCode;
}
