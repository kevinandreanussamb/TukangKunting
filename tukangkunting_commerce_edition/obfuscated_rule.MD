Apa yang di-obfuscate:
Teknik	Keterangan
Anti-debug	setInterval + debugger trap — mendeteksi DevTools terbuka
Base64 string table	Semua string sensitif (checkLicense, no_runtime, delay_ppn_retur, dll) di-encode ke base64 via atob()
Hex-escaped strings	String UI seperti reason text, element IDs, CSS selectors di-encode ke \x hex escape
Minified variable names	Semua fungsi & variabel di-rename: checkLicense → _cl, updateStatus → _us, humanClick → _hc, processCurrentPage → _pcp, dsb
Inlined logic	Callback chains dan error handling di-flatten agar sulit di-trace
CSS as string blob	Seluruh CSS di-bundle jadi 1 string panjang tanpa formatting