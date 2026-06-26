using UnityEngine;

/// <summary>
/// Teleports the player to mall entrance when React loads /unity-mall?spawn=entrance
/// Setup in Unity:
/// 1. Empty GameObject named exactly: MallSpawnManager
/// 2. Attach this script
/// 3. Assign Entrance Spawn (empty at Main-Gate) and Player transform
/// Copy to: Assets/Main-Scripts/MallSpawnManager.cs
/// </summary>
public class MallSpawnManager : MonoBehaviour
{
    [Header("Drag Main-Gate entrance empty here")]
    public Transform entranceSpawn;

    [Header("Player root (with CharacterController)")]
    public Transform player;

    void Awake()
    {
        if (player == null)
        {
            var pc = FindObjectOfType<PlayerController>();
            if (pc != null) player = pc.transform;
        }

        if (entranceSpawn == null)
        {
            var gate = GameObject.Find("Main-Gate");
            if (gate != null) entranceSpawn = gate.transform;
        }
    }

    /// <summary>Called from website: unityInstance.SendMessage('MallSpawnManager', 'SpawnAtEntrance', '')</summary>
    public void SpawnAtEntrance()
    {
        TeleportTo(entranceSpawn);
    }

    public void SpawnAt(string spawnName)
    {
        if (string.IsNullOrWhiteSpace(spawnName) || spawnName == "entrance")
        {
            SpawnAtEntrance();
            return;
        }

        var point = GameObject.Find(spawnName);
        if (point != null) TeleportTo(point.transform);
        else Debug.LogWarning("[MallSpawnManager] Spawn not found: " + spawnName);
    }

    void TeleportTo(Transform target)
    {
        if (target == null || player == null)
        {
            Debug.LogWarning("[MallSpawnManager] Missing entrance or player");
            return;
        }

        var cc = player.GetComponent<CharacterController>();
        if (cc != null) cc.enabled = false;

        player.SetPositionAndRotation(target.position, target.rotation);

        if (cc != null) cc.enabled = true;

        Debug.Log("[MallSpawnManager] Player at entrance");
    }
}
