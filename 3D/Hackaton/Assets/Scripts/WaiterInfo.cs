using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.Networking;
using System;

[System.Serializable]
public class MapDataResponse
{
    public Vector2[] points;
    public int[] connections;
    public float[] wallHeights;
    public float[] wallThicknesses;
    public WindowData[] windows;
    public DoorData[] doors;
}

[System.Serializable]
public class WindowData
{
    public Vector2[] points;
    public int[] connections;
    public float height;
    public int wallIndex;
}

[System.Serializable]
public class DoorData
{
    public Vector2[] points;
    public int[] connections;
    public float height;
    public int wallIndex;
}

public class TestMap : MonoBehaviour
{
    public SimpleMapGenerator mapGenerator;

    [Header("Настройки материалов")]
    public Material windowMaterial;
    public Material doorMaterial;

    [Header("Настройки автоматической ширины")]
    public float windowWidthOffset = 0.01f;
    public float doorWidthOffset = 0.01f;

    [Header("API Settings")]
    public string apiUrl = "http://localhost:3000/api/map-data";
    public float requestTimeout = 10f;

    void Start()
    {
        StartCoroutine(LoadMapDataFromServer());
    }

    IEnumerator LoadMapDataFromServer()
    {
        using (UnityWebRequest request = UnityWebRequest.Get(apiUrl))
        {
            request.timeout = (int)requestTimeout;

            Debug.Log($"Загрузка данных карты с сервера: {apiUrl}");

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                try
                {
                    string jsonResponse = request.downloadHandler.text;
                    Debug.Log($"Получены данные: {jsonResponse}");

                    MapDataResponse mapData = JsonUtility.FromJson<MapDataResponse>(jsonResponse);
                    ProcessMapData(mapData);
                }
                catch (Exception e)
                {
                    Debug.LogError($"Ошибка парсинга JSON: {e.Message}");
                    // Используем тестовые данные при ошибке
                    UseTestData();
                }
            }
            else
            {
                Debug.LogError($"Ошибка загрузки данных: {request.error}");
                // Используем тестовые данные при ошибке сети
                UseTestData();
            }
        }
    }

    void ProcessMapData(MapDataResponse mapData)
    {
        if (mapData == null)
        {
            Debug.LogError("Получены пустые данные");
            UseTestData();
            return;
        }

        // Проверяем обязательные поля
        if (mapData.points == null || mapData.connections == null)
        {
            Debug.LogError("Отсутствуют обязательные данные (points или connections)");
            UseTestData();
            return;
        }

        // Устанавливаем данные в генератор
        mapGenerator.SetPoints(mapData.points);
        mapGenerator.SetConnections(mapData.connections);

        // Устанавливаем размеры стен (если предоставлены)
        if (mapData.wallHeights != null && mapData.wallThicknesses != null)
        {
            mapGenerator.SetWallDimensions(mapData.wallHeights, mapData.wallThicknesses);
        }

        // Устанавливаем окна (если предоставлены)
        if (mapData.windows != null && mapData.windows.Length > 0)
        {
            SimpleMapGenerator.WindowData[] windows = ConvertWindowData(mapData.windows);
            mapGenerator.SetWindows(windows);
        }

        // Устанавливаем двери (если предоставлены)
        if (mapData.doors != null && mapData.doors.Length > 0)
        {
            SimpleMapGenerator.DoorData[] doors = ConvertDoorData(mapData.doors);
            mapGenerator.SetDoors(doors);
        }

        mapGenerator.SetWindowWidthOffset(windowWidthOffset);
        mapGenerator.SetDoorWidthOffset(doorWidthOffset);
        mapGenerator.doorLayerMask = LayerMask.GetMask("Doors");

        mapGenerator.GenerateMap();
        AssignDoorLayers();

        Debug.Log("Карта успешно сгенерирована из данных сервера");
    }

    SimpleMapGenerator.WindowData[] ConvertWindowData(WindowData[] serverWindows)
    {
        SimpleMapGenerator.WindowData[] windows = new SimpleMapGenerator.WindowData[serverWindows.Length];

        for (int i = 0; i < serverWindows.Length; i++)
        {
            windows[i] = new SimpleMapGenerator.WindowData
            {
                points = serverWindows[i].points,
                connections = serverWindows[i].connections,
                height = serverWindows[i].height,
                wallIndex = serverWindows[i].wallIndex
            };
        }

        return windows;
    }

    SimpleMapGenerator.DoorData[] ConvertDoorData(DoorData[] serverDoors)
    {
        SimpleMapGenerator.DoorData[] doors = new SimpleMapGenerator.DoorData[serverDoors.Length];

        for (int i = 0; i < serverDoors.Length; i++)
        {
            doors[i] = new SimpleMapGenerator.DoorData
            {
                points = serverDoors[i].points,
                connections = serverDoors[i].connections,
                height = serverDoors[i].height,
                wallIndex = serverDoors[i].wallIndex
            };
        }

        return doors;
    }

    void UseTestData()
    {
        Debug.Log("Используются тестовые данные");
        TestRoomWithDoors();
    }

    void TestRoomWithDoors()
    {
        // Точки для комнаты
        Vector2[] points = {
            new Vector2(0, 0),
            new Vector2(6, 0),
            new Vector2(6, 4),
            new Vector2(0, 4)
        };

        // Соединения: стены между точками
        int[] connections = {
            0, 1,  // нижняя стена
            1, 2,  // правая стена
            2, 3,  // верхняя стена
            3, 0   // левая стена
        };

        // Высота для каждой стены
        float[] wallHeights = {
            2.5f,
            2.5f,
            2.5f,
            2.5f
        };

        // Толщина для каждой стены
        float[] wallThicknesses = {
            0.2f,
            0.2f,
            0.2f,
            0.2f
        };

        // Создаем окна
        SimpleMapGenerator.WindowData[] windows = new SimpleMapGenerator.WindowData[1];
        windows[0] = new SimpleMapGenerator.WindowData
        {
            points = new Vector2[] {
                new Vector2(6, 1.5f),
                new Vector2(6, 2.5f)
            },
            connections = new int[] { 0, 1 },
            height = 1.0f,
            wallIndex = 1
        };

        // Создаем двери
        SimpleMapGenerator.DoorData[] doors = new SimpleMapGenerator.DoorData[2];
        doors[0] = new SimpleMapGenerator.DoorData
        {
            points = new Vector2[] {
            new Vector2(1, 0),
            new Vector2(2, 0)
        },
            connections = new int[] { 0, 1 },
            height = 2.0f,
            wallIndex = 0
        };
        doors[1] = new SimpleMapGenerator.DoorData
        {
            points = new Vector2[] {
            new Vector2(0, 1),
            new Vector2(0, 2)
        },
            connections = new int[] { 0, 1 },
            height = 2.0f,
            wallIndex = 3
        };

        mapGenerator.SetPoints(points);
        mapGenerator.SetConnections(connections);
        mapGenerator.SetWallDimensions(wallHeights, wallThicknesses);
        mapGenerator.SetWindows(windows);
        mapGenerator.SetDoors(doors);
        mapGenerator.SetWindowWidthOffset(windowWidthOffset);
        mapGenerator.SetDoorWidthOffset(doorWidthOffset);
        mapGenerator.doorLayerMask = LayerMask.GetMask("Doors");

        mapGenerator.GenerateMap();
        AssignDoorLayers();
    }

    void AssignDoorLayers()
    {
        List<GameObject> doorObjects = mapGenerator.GetDoorObjects();
        int doorLayer = LayerMask.NameToLayer("Doors");

        if (doorLayer == -1)
        {
            Debug.LogWarning("Слой 'Doors' не существует. Создайте слой 'Doors' в настройках проекта.");
            return;
        }

        foreach (GameObject door in doorObjects)
        {
            if (door != null)
            {
                door.layer = doorLayer;
            }
        }
    }

    public void RegenerateMap()
    {
        StartCoroutine(LoadMapDataFromServer());
    }

    // Метод для ручной отправки данных на сервер (если нужно)
    public void SendMapDataToServer(MapDataResponse mapData)
    {
        StartCoroutine(PostMapData(mapData));
    }

    IEnumerator PostMapData(MapDataResponse mapData)
    {
        string jsonData = JsonUtility.ToJson(mapData);

        using (UnityWebRequest request = UnityWebRequest.PostWwwForm(apiUrl, jsonData))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"Ошибка отправки данных: {request.error}");
            }
            else
            {
                Debug.Log("Данные успешно отправлены на сервер");
            }
        }
    }
}