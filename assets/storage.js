(function () {
  "use strict";

  var databaseName = "eve-rookie-debut-v2";
  var storeName = "days";
  var databasePromise = null;

  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error("indexeddb-unavailable"));
        return;
      }
      var request = window.indexedDB.open(databaseName, 1);
      request.onupgradeneeded = function () {
        var database = request.result;
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: "date" });
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("indexeddb-open-failed")); };
    });
    return databasePromise;
  }

  function runTransaction(mode, operation) {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        var transaction = database.transaction(storeName, mode);
        var store = transaction.objectStore(storeName);
        var request = operation(store);
        var result;

        request.onsuccess = function () {
          result = request.result;
          if (mode === "readonly") resolve(result);
        };
        request.onerror = function () { reject(request.error || new Error("indexeddb-request-failed")); };
        transaction.oncomplete = function () {
          if (mode === "readwrite") resolve(result);
        };
        transaction.onabort = function () { reject(transaction.error || new Error("indexeddb-transaction-aborted")); };
      });
    });
  }

  function getDay(date) {
    return runTransaction("readonly", function (store) { return store.get(date); });
  }

  function putDay(record) {
    return runTransaction("readwrite", function (store) { return store.put(record); });
  }

  function deleteDay(date) {
    return runTransaction("readwrite", function (store) { return store.delete(date); });
  }

  function clearDays() {
    return runTransaction("readwrite", function (store) { return store.clear(); });
  }

  function getAllDays() {
    return runTransaction("readonly", function (store) { return store.getAll(); }).then(function (records) {
      return records.sort(function (a, b) { return b.date.localeCompare(a.date); });
    });
  }

  function pruneBefore(oldestDateToKeep) {
    return getAllDays().then(function (records) {
      return Promise.all(records.filter(function (record) {
        return record.date < oldestDateToKeep;
      }).map(function (record) {
        return deleteDay(record.date);
      }));
    });
  }

  window.EveDailyStore = {
    clear: clearDays,
    deleteDay: deleteDay,
    getAllDays: getAllDays,
    getDay: getDay,
    open: openDatabase,
    pruneBefore: pruneBefore,
    putDay: putDay
  };
})();
