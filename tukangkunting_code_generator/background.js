/**
 * Tukang License — Background Service Worker
 * Minimal — hanya logging startup
 * Semua logic generate/verify ada di popup.js
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Tukang License] Extension installed.");
});

chrome.runtime.onStartup.addListener(() => {
  console.log("[Tukang License] Extension started.");
});