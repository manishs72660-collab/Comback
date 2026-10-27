const databaseName = "comeback-offline";
const databaseVersion = 1;
let databasePromise;

const openDatabase = () => {
  if (!("indexedDB" in window)) return Promise.reject(new Error("Offline storage is not available in this browser."));
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(databaseName, databaseVersion);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("profiles")) database.createObjectStore("profiles", { keyPath: "userId" });
        if (!database.objectStoreNames.contains("workspace")) database.createObjectStore("workspace", { keyPath: "userId" });
        if (!database.objectStoreNames.contains("mutations")) {
          const store = database.createObjectStore("mutations", { keyPath: "id" });
          store.createIndex("userId", "userId", { unique: false });
        }
        if (!database.objectStoreNames.contains("metadata")) database.createObjectStore("metadata", { keyPath: "key" });
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error || new Error("Unable to open offline storage."));
      request.onblocked = () => reject(new Error("Offline storage is busy in another tab. Close other Comback tabs and retry."));
    }).catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
};

const storeRequest = async (storeName, mode, action) => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    let result;
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => reject(request.error || new Error("Offline storage request failed."));
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || new Error("Offline storage transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("Offline storage transaction failed."));
  });
};

const readByUser = (storeName, userId) => storeRequest(storeName, "readonly", (store) => store.get(userId));

const createMutationId = () => {
  if (typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const saveTrustedOfflineProfile = async (user) => {
  const userId = String(user?.id || user?._id || "");
  if (!userId) throw new Error("Cannot save an offline profile without an authenticated account.");
  await storeRequest("profiles", "readwrite", (store) => store.put({ userId, profile: user, savedAt: Date.now() }));
  await storeRequest("metadata", "readwrite", (store) => store.put({ key: "lastAuthenticatedUser", userId }));
};

export const getLastAuthenticatedOfflineProfile = async () => {
  const metadata = await storeRequest("metadata", "readonly", (store) => store.get("lastAuthenticatedUser"));
  if (!metadata?.userId) return null;
  const record = await readByUser("profiles", metadata.userId);
  return record?.profile || null;
};

export const saveWorkspaceSnapshot = async (userId, snapshot) =>
  storeRequest("workspace", "readwrite", (store) => store.put({ userId: String(userId), ...snapshot, savedAt: Date.now() }));

export const getWorkspaceSnapshot = async (userId) => readByUser("workspace", String(userId));

export const createTaskMutation = async (userId, payload) => {
  const mutation = {
    id: createMutationId(),
    userId: String(userId),
    payload,
    state: "pending",
    attempts: 0,
    createdAt: Date.now(),
    error: "",
  };
  await storeRequest("mutations", "readwrite", (store) => store.add(mutation));
  return mutation;
};

export const getTaskMutations = async (userId) => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("mutations", "readonly");
    const request = transaction.objectStore("mutations").index("userId").getAll(String(userId));
    request.onsuccess = () => resolve(request.result.sort((left, right) => left.createdAt - right.createdAt));
    request.onerror = () => reject(request.error || new Error("Unable to read queued tasks."));
  });
};

export const saveTaskMutation = async (mutation) =>
  storeRequest("mutations", "readwrite", (store) => store.put(mutation));

export const removeTaskMutation = async (id) =>
  storeRequest("mutations", "readwrite", (store) => store.delete(id));

export const clearAccountOfflineData = async (userId) => {
  const accountId = String(userId || "");
  if (!accountId) return;
  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(["profiles", "workspace", "metadata"], "readwrite");
    transaction.objectStore("profiles").delete(accountId);
    transaction.objectStore("workspace").delete(accountId);
    const metadata = transaction.objectStore("metadata").get("lastAuthenticatedUser");
    metadata.onsuccess = () => {
      if (metadata.result?.userId === accountId) transaction.objectStore("metadata").delete("lastAuthenticatedUser");
    };
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Unable to clear cached account data."));
    transaction.onabort = () => reject(transaction.error || new Error("Unable to clear cached account data."));
  });
};

export const clearAllOfflineData = async () => {
  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(["profiles", "workspace", "metadata"], "readwrite");
    transaction.objectStore("profiles").clear();
    transaction.objectStore("workspace").clear();
    transaction.objectStore("metadata").clear();
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Unable to clear cached account data."));
    transaction.onabort = () => reject(transaction.error || new Error("Unable to clear cached account data."));
  });
};
