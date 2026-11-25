// ============ 媒体文件：IndexedDB 存储（头像/证书图/背景图/上传音频/听力文件） ============
// 每种媒体 key 语义：
//   avatar:xxx 头像
//   img:xxx    证书图片 / 自定义背景图
//   audio:xxx  音频库（铃声/提示音）
//   listen:xxx 听力考试音频（英语听力用）

const DB_NAME = "zhishi-media";
const DB_VER = 1;
const STORE = "files";

let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("浏览器不支持 IndexedDB"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

// 把 IDBRequest 转成 Promise<result>
function doReq(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB 操作失败"));
  });
}

// 在事务里执行一次请求；mode: readonly | readwrite
async function run(mode, build) {
  const db = await openDB();
  const t = db.transaction(STORE, mode);
  const os = t.objectStore(STORE);
  return doReq(build(os));
}

export const media = {
  // 保存文件，返回 {key, name, mime, size}
  async put(kind, file) {
    const key = `${kind}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const rec = {
      key,
      kind,
      name: file.name || "",
      mime: file.type || "",
      size: file.size || 0,
      addedAt: Date.now(),
      blob: file
    };
    await run("readwrite", (os) => os.put(rec));
    return rec;
  },

  // 直接保存 key（用于替换头像/背景/恢复备份）
  async putAs(key, file) {
    const rec = {
      key,
      kind: key.split(":")[0],
      name: file.name || "",
      mime: file.type || "",
      size: file.size || 0,
      addedAt: Date.now(),
      blob: file
    };
    await run("readwrite", (os) => os.put(rec));
    return rec;
  },

  async get(key) {
    if (!key) return null;
    const rec = await run("readonly", (os) => os.get(key));
    return rec || null;
  },

  // 返回全部元数据（含 blob 引用），可按 kind 过滤
  async list(kind) {
    const rows = await run("readonly", (os) => os.getAll());
    const all = rows || [];
    return kind ? all.filter((r) => r.kind === kind) : all;
  },

  async url(key) {
    const rec = await this.get(key);
    if (!rec || !rec.blob) return null;
    return URL.createObjectURL(rec.blob);
  },

  async remove(key) {
    await run("readwrite", (os) => os.delete(key));
  },

  async removeMany(keys) {
    if (!keys || !keys.length) return;
    await run("readwrite", (os) => {
      keys.forEach((k) => os.delete(k));
    });
  },

  // 清除某类，返回被清掉的 key 列表
  async clearKind(kind) {
    const rows = await this.list(kind);
    const keys = rows.map((r) => r.key);
    await this.removeMany(keys);
    return keys;
  },

  async size(kind) {
    const rows = await this.list(kind);
    return rows.reduce((s, r) => s + (r.size || 0), 0);
  },

  async allSize() {
    const rows = await this.list();
    return rows.reduce((s, r) => s + (r.size || 0), 0);
  }
};
