// State Management
const STORAGE_KEY = 'sistem_nilai_data';
let appData = {
    kelas: [],
    siswa: [],
    mapel: [],
    kategori: [],
    jurnal: [], // { id, tanggal, kelasId, mapelId, materi, metode, catatan }
    bobot: {}, // { mapelId: { kategoriId: weight } }
    nilai: {},  // { siswaId: { mapelId: { kategoriId: score } } }
    kehadiran: [] // { id, tanggal, kelasId, mapelId, siswaId, status }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupNavigation();
    updateDashboardStats();
    renderAllTables();
});

// Data Persistence
function loadData() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        appData = JSON.parse(storedData);
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    updateDashboardStats();
}

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show target view
            const targetId = item.getAttribute('data-target');
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === `view-${targetId}`) {
                    view.classList.add('active');
                }
            });

            // Update Header Title
            pageTitle.textContent = item.textContent.trim();

            // Refresh data for specific views
            if (targetId === 'siswa') renderKelasOptions('filter-siswa-kelas', true);
            if (targetId === 'bobot') renderMapelOptions('select-bobot-mapel');
            if (targetId === 'input-nilai') {
                renderKelasOptions('input-kelas');
                renderMapelOptions('input-mapel');
                renderKategoriOptions('input-kategori');
            }
            if (targetId === 'rekap') {
                renderKelasOptions('rekap-kelas');
                renderMapelOptions('rekap-mapel');
            }
            if (targetId === 'jurnal') {
                renderJurnalTable();
            }
            if (targetId === 'input-kehadiran') {
                renderKelasOptions('absensi-kelas');
                renderMapelOptions('absensi-mapel');
                document.getElementById('absensi-tanggal').valueAsDate = new Date();
            }
            if (targetId === 'rekap-kehadiran') {
                renderKelasOptions('rekap-absensi-kelas');
                renderMapelOptions('rekap-absensi-mapel');
            }
        });
    });
}

// Dashboard Stats
function updateDashboardStats() {
    document.getElementById('stat-siswa').textContent = appData.siswa.length;
    document.getElementById('stat-kelas').textContent = appData.kelas.length;
    document.getElementById('stat-mapel').textContent = appData.mapel.length;
}

// Modal Management
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    if (modalId === 'modal-siswa') renderKelasOptions('siswa-kelas');
    if (modalId === 'modal-jurnal') {
        renderKelasOptions('jurnal-kelas');
        renderMapelOptions('jurnal-mapel');
        // Set default date to today
        document.getElementById('jurnal-tanggal').valueAsDate = new Date();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Helper: Generate ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// --- KELAS MANAGEMENT ---
function addKelas() {
    const nama = document.getElementById('kelas-nama').value;
    if (!nama) return alert('Nama kelas harus diisi!');

    appData.kelas.push({ id: generateId(), nama: nama });
    saveData();
    renderKelasTable();
    closeModal('modal-kelas');
    document.getElementById('kelas-nama').value = '';
}

function renderKelasTable() {
    const tbody = document.getElementById('table-kelas-body');
    tbody.innerHTML = '';
    appData.kelas.forEach((k, index) => {
        const siswaCount = appData.siswa.filter(s => s.kelasId === k.id).length;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${k.nama}</td>
            <td>${siswaCount} Siswa</td>
            <td>
                <button class="btn-danger" onclick="deleteKelas('${k.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteKelas(id) {
    if (confirm('Hapus kelas ini? Data siswa di dalamnya mungkin akan terpengaruh.')) {
        appData.kelas = appData.kelas.filter(k => k.id !== id);
        saveData();
        renderKelasTable();
    }
}

// --- SISWA MANAGEMENT ---
function addSiswa() {
    const nama = document.getElementById('siswa-nama').value;
    const nis = document.getElementById('siswa-nis').value;
    const kelasId = document.getElementById('siswa-kelas').value;

    if (!nama || !nis || !kelasId) return alert('Semua data harus diisi!');

    appData.siswa.push({ id: generateId(), nama, nis, kelasId });
    saveData();
    renderSiswaTable();
    closeModal('modal-siswa');
    document.getElementById('siswa-nama').value = '';
    document.getElementById('siswa-nis').value = '';
}

function renderSiswaTable() {
    const tbody = document.getElementById('table-siswa-body');
    const filterKelas = document.getElementById('filter-siswa-kelas').value;
    tbody.innerHTML = '';

    let filteredSiswa = appData.siswa;
    if (filterKelas) {
        filteredSiswa = filteredSiswa.filter(s => s.kelasId === filterKelas);
    }

    filteredSiswa.forEach((s, index) => {
        const kelas = appData.kelas.find(k => k.id === s.kelasId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${s.nis}</td>
            <td>${s.nama}</td>
            <td>${kelas ? kelas.nama : '-'}</td>
            <td>
                <button class="btn-danger" onclick="deleteSiswa('${s.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteSiswa(id) {
    if (confirm('Hapus siswa ini?')) {
        appData.siswa = appData.siswa.filter(s => s.id !== id);
        // Clean up grades
        delete appData.nilai[id];
        saveData();
        renderSiswaTable();
    }
}

// --- MAPEL MANAGEMENT ---
function addMapel() {
    const nama = document.getElementById('mapel-nama').value;
    const deskripsi = document.getElementById('mapel-deskripsi').value;

    if (!nama) return alert('Nama mata pelajaran harus diisi!');

    appData.mapel.push({ id: generateId(), nama, deskripsi });
    saveData();
    renderMapelTable();
    closeModal('modal-mapel');
    document.getElementById('mapel-nama').value = '';
    document.getElementById('mapel-deskripsi').value = '';
}

function renderMapelTable() {
    const tbody = document.getElementById('table-mapel-body');
    tbody.innerHTML = '';
    appData.mapel.forEach((m, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${m.nama}</td>
            <td>${m.deskripsi}</td>
            <td>
                <button class="btn-danger" onclick="deleteMapel('${m.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteMapel(id) {
    if (confirm('Hapus mata pelajaran ini?')) {
        appData.mapel = appData.mapel.filter(m => m.id !== id);
        delete appData.bobot[id];
        saveData();
        renderMapelTable();
    }
}

// --- KATEGORI MANAGEMENT ---
function addKategori() {
    const nama = document.getElementById('kategori-nama').value;
    const deskripsi = document.getElementById('kategori-deskripsi').value;

    if (!nama) return alert('Nama kategori harus diisi!');

    appData.kategori.push({ id: generateId(), nama, deskripsi });
    saveData();
    renderKategoriTable();
    closeModal('modal-kategori');
    document.getElementById('kategori-nama').value = '';
    document.getElementById('kategori-deskripsi').value = '';
}

function renderKategoriTable() {
    const tbody = document.getElementById('table-kategori-body');
    tbody.innerHTML = '';
    appData.kategori.forEach((k, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${k.nama}</td>
            <td>${k.deskripsi}</td>
            <td>
                <button class="btn-danger" onclick="deleteKategori('${k.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteKategori(id) {
    if (confirm('Hapus kategori ini?')) {
        appData.kategori = appData.kategori.filter(k => k.id !== id);
        saveData();
        renderKategoriTable();
    }
}

// --- JURNAL MANAGEMENT ---
function addJurnal() {
    const tanggal = document.getElementById('jurnal-tanggal').value;
    const kelasId = document.getElementById('jurnal-kelas').value;
    const mapelId = document.getElementById('jurnal-mapel').value;
    const materi = document.getElementById('jurnal-materi').value;
    const metode = document.getElementById('jurnal-metode').value;
    const catatan = document.getElementById('jurnal-catatan').value;

    if (!tanggal || !kelasId || !mapelId || !materi) return alert('Tanggal, Kelas, Mapel, dan Materi wajib diisi!');

    appData.jurnal.push({
        id: generateId(),
        tanggal,
        kelasId,
        mapelId,
        materi,
        metode,
        catatan
    });
    saveData();
    renderJurnalTable();
    closeModal('modal-jurnal');

    // Reset form
    document.getElementById('jurnal-materi').value = '';
    document.getElementById('jurnal-metode').value = '';
    document.getElementById('jurnal-catatan').value = '';
}

function renderJurnalTable() {
    const tbody = document.getElementById('table-jurnal-body');
    tbody.innerHTML = '';

    // Sort by date descending
    const sortedJurnal = [...appData.jurnal].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    sortedJurnal.forEach((j, index) => {
        const kelas = appData.kelas.find(k => k.id === j.kelasId);
        const mapel = appData.mapel.find(m => m.id === j.mapelId);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${j.tanggal}</td>
            <td>${kelas ? kelas.nama : '-'}</td>
            <td>${mapel ? mapel.nama : '-'}</td>
            <td>${j.materi}</td>
            <td>${j.metode || '-'}</td>
            <td>
                <button class="btn-danger" onclick="deleteJurnal('${j.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteJurnal(id) {
    if (confirm('Hapus jurnal ini?')) {
        appData.jurnal = appData.jurnal.filter(j => j.id !== id);
        saveData();
        renderJurnalTable();
    }
}

// --- BOBOT MANAGEMENT ---
function renderBobotForm() {
    const mapelId = document.getElementById('select-bobot-mapel').value;
    const container = document.getElementById('bobot-container');
    container.innerHTML = '';

    if (!mapelId) {
        container.innerHTML = '<p class="text-muted">Silakan pilih mata pelajaran terlebih dahulu.</p>';
        document.getElementById('total-bobot-value').textContent = '0';
        return;
    }

    const currentWeights = appData.bobot[mapelId] || {};

    appData.kategori.forEach(k => {
        const div = document.createElement('div');
        div.className = 'bobot-item';
        div.innerHTML = `
            <label>${k.nama} (${k.deskripsi})</label>
            <input type="number" class="form-control bobot-input" 
                   data-kategori="${k.id}" 
                   value="${currentWeights[k.id] || 0}" 
                   min="0" max="100" oninput="calculateTotalBobot()">
            <span>%</span>
        `;
        container.appendChild(div);
    });
    calculateTotalBobot();
}

function calculateTotalBobot() {
    const inputs = document.querySelectorAll('.bobot-input');
    let total = 0;
    inputs.forEach(input => total += parseInt(input.value || 0));
    const totalDisplay = document.getElementById('total-bobot-value');
    totalDisplay.textContent = total;
    totalDisplay.style.color = total === 100 ? 'var(--success-color)' : 'var(--danger-color)';
}

function saveWeights() {
    const mapelId = document.getElementById('select-bobot-mapel').value;
    if (!mapelId) return alert('Pilih mata pelajaran!');

    const inputs = document.querySelectorAll('.bobot-input');
    let total = 0;
    const weights = {};

    inputs.forEach(input => {
        const val = parseInt(input.value || 0);
        total += val;
        weights[input.dataset.kategori] = val;
    });

    if (total !== 100) return alert(`Total bobot harus 100%! Saat ini: ${total}%`);

    appData.bobot[mapelId] = weights;
    saveData();
    alert('Bobot berhasil disimpan!');
}

// --- INPUT NILAI ---
function prepareInputNilai() {
    const kelasId = document.getElementById('input-kelas').value;
    const mapelId = document.getElementById('input-mapel').value;
    const kategoriId = document.getElementById('input-kategori').value;
    const tbody = document.getElementById('table-input-nilai-body');

    if (!kelasId || !mapelId || !kategoriId) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Pilih Kelas, Mapel, dan Kategori untuk memulai.</td></tr>';
        return;
    }

    const siswaInKelas = appData.siswa.filter(s => s.kelasId === kelasId);
    tbody.innerHTML = '';

    if (siswaInKelas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Tidak ada siswa di kelas ini.</td></tr>';
        return;
    }

    siswaInKelas.forEach((s, index) => {
        // Get existing score if any
        let currentScore = '';
        if (appData.nilai[s.id] && appData.nilai[s.id][mapelId] && appData.nilai[s.id][mapelId][kategoriId]) {
            currentScore = appData.nilai[s.id][mapelId][kategoriId];
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${s.nama} (${s.nis})</td>
            <td>
                <input type="number" class="form-control input-score" 
                       data-siswa="${s.id}" 
                       value="${currentScore}" 
                       min="0" max="100" placeholder="0-100">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function saveGrades() {
    const mapelId = document.getElementById('input-mapel').value;
    const kategoriId = document.getElementById('input-kategori').value;

    if (!mapelId || !kategoriId) return alert('Data belum lengkap!');

    const inputs = document.querySelectorAll('.input-score');
    let count = 0;

    inputs.forEach(input => {
        const siswaId = input.dataset.siswa;
        const score = input.value;

        if (!appData.nilai[siswaId]) appData.nilai[siswaId] = {};
        if (!appData.nilai[siswaId][mapelId]) appData.nilai[siswaId][mapelId] = {};

        appData.nilai[siswaId][mapelId][kategoriId] = score;
        count++;
    });

    saveData();
    alert(`${count} Nilai berhasil disimpan!`);
}

// --- REKAP NILAI ---
function renderRekapTable() {
    const kelasId = document.getElementById('rekap-kelas').value;
    const mapelId = document.getElementById('rekap-mapel').value;
    const thead = document.getElementById('rekap-table-head');
    const tbody = document.getElementById('rekap-table-body');

    if (!kelasId || !mapelId) {
        tbody.innerHTML = '<tr><td colspan="100%" class="text-center">Pilih Kelas dan Mapel untuk melihat rekap.</td></tr>';
        thead.innerHTML = '';
        return;
    }

    // Headers
    let headerHTML = '<th>No</th><th>Nama Siswa</th>';
    appData.kategori.forEach(k => {
        headerHTML += `<th>${k.nama}</th>`;
    });
    headerHTML += '<th>Nilai Akhir</th><th>Predikat</th>';
    thead.innerHTML = headerHTML;

    // Body
    const siswaInKelas = appData.siswa.filter(s => s.kelasId === kelasId);
    const weights = appData.bobot[mapelId] || {};

    tbody.innerHTML = '';
    siswaInKelas.forEach((s, index) => {
        let rowHTML = `<td>${index + 1}</td><td>${s.nama}</td>`;
        let totalScore = 0;
        let totalWeight = 0;

        appData.kategori.forEach(k => {
            let score = 0;
            if (appData.nilai[s.id] && appData.nilai[s.id][mapelId] && appData.nilai[s.id][mapelId][k.id]) {
                score = parseFloat(appData.nilai[s.id][mapelId][k.id]) || 0;
            }
            rowHTML += `<td>${score}</td>`;

            const weight = weights[k.id] || 0;
            totalScore += (score * weight / 100);
            totalWeight += weight;
        });

        const finalScore = totalWeight > 0 ? totalScore.toFixed(2) : 0;
        const predikat = getPredikat(finalScore);

        rowHTML += `<td><strong>${finalScore}</strong></td><td><span class="badge ${predikat}">${predikat}</span></td>`;

        const tr = document.createElement('tr');
        tr.innerHTML = rowHTML;
        tbody.appendChild(tr);
    });
}

function getPredikat(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
}

// --- DATA MANAGEMENT & UTILS ---
function renderKelasOptions(selectId, includeAll = false) {
    const select = document.getElementById(selectId);
    select.innerHTML = includeAll ? '<option value="">Semua Kelas</option>' : '<option value="">-- Pilih Kelas --</option>';
    appData.kelas.forEach(k => {
        const option = document.createElement('option');
        option.value = k.id;
        option.textContent = k.nama;
        select.appendChild(option);
    });
}

function renderMapelOptions(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">-- Pilih Mapel --</option>';
    appData.mapel.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = m.nama;
        select.appendChild(option);
    });
}

function renderKategoriOptions(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    appData.kategori.forEach(k => {
        const option = document.createElement('option');
        option.value = k.id;
        option.textContent = k.nama;
        select.appendChild(option);
    });
}

function renderAllTables() {
    renderKelasTable();
    renderSiswaTable();
    renderMapelTable();
    renderKategoriTable();
}

function backupData() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_nilai_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function restoreData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm('Apakah Anda yakin ingin me-restore data? Data saat ini akan ditimpa.')) {
                appData = data;
                saveData();
                location.reload();
            }
        } catch (err) {
            alert('File backup tidak valid!');
        }
    };
    reader.readAsText(file);
}

function resetData() {
    if (confirm('PERINGATAN: Semua data akan dihapus permanen! Lanjutkan?')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

function exportToExcel() {
    const table = document.getElementById('rekap-table');
    let html = table.outerHTML;

    // Simple Excel Export
    const url = 'data:application/vnd.ms-excel,' + encodeURIComponent(html);
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    downloadLink.href = url;
    downloadLink.download = 'rekap_nilai.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// --- SISWA IMPORT/EXPORT ---
function downloadStudentTemplate() {
    const wb = XLSX.utils.book_new();
    const ws_data = [['Nama Siswa', 'NIS', 'Nama Kelas']];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
    XLSX.writeFile(wb, "template_siswa.xlsx");
}

function handleStudentImport(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        processStudentImport(jsonData);
        input.value = ''; // Reset input
    };
    reader.readAsArrayBuffer(file);
}

function processStudentImport(data) {
    // Skip header row
    if (data.length <= 1) return alert('File kosong atau format salah!');

    let successCount = 0;

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const nama = row[0];
        const nis = row[1];
        const namaKelas = row[2];

        if (nama && nis) {
            // Find or create class
            let kelasId = '';
            if (namaKelas) {
                const existingKelas = appData.kelas.find(k => k.nama.toLowerCase() === namaKelas.toString().toLowerCase());
                if (existingKelas) {
                    kelasId = existingKelas.id;
                } else {
                    // Create new class if not exists
                    const newKelas = { id: generateId(), nama: namaKelas };
                    appData.kelas.push(newKelas);
                    kelasId = newKelas.id;
                }
            }

            // Add student
            appData.siswa.push({
                id: generateId(),
                nama: nama,
                nis: nis.toString(),
                kelasId: kelasId
            });
            successCount++;
        }
    }

    saveData();
    renderAllTables(); // Refresh all tables including kelas and siswa
    saveData();
    renderAllTables(); // Refresh all tables including kelas and siswa
    alert(`Berhasil mengimport ${successCount} siswa!`);
}

// --- KEHADIRAN MANAGEMENT ---
function renderInputKehadiranTable() {
    const kelasId = document.getElementById('absensi-kelas').value;
    const mapelId = document.getElementById('absensi-mapel').value;
    const tanggal = document.getElementById('absensi-tanggal').value;
    const tbody = document.getElementById('table-input-kehadiran-body');

    if (!kelasId || !mapelId || !tanggal) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Pilih Kelas, Mapel, dan Tanggal untuk memulai.</td></tr>';
        return;
    }

    const siswaInKelas = appData.siswa.filter(s => s.kelasId === kelasId);
    tbody.innerHTML = '';

    if (siswaInKelas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada siswa di kelas ini.</td></tr>';
        return;
    }

    siswaInKelas.forEach((s, index) => {
        // Find existing attendance record
        const existingRecord = appData.kehadiran.find(k =>
            k.kelasId === kelasId &&
            k.mapelId === mapelId &&
            k.tanggal === tanggal &&
            k.siswaId === s.id
        );

        const status = existingRecord ? existingRecord.status : '';
        const keterangan = existingRecord ? existingRecord.keterangan || '' : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${s.nama}</td>
            <td class="text-center"><input type="radio" name="status-${s.id}" value="H" ${status === 'H' ? 'checked' : ''}></td>
            <td class="text-center"><input type="radio" name="status-${s.id}" value="I" ${status === 'I' ? 'checked' : ''}></td>
            <td class="text-center"><input type="radio" name="status-${s.id}" value="S" ${status === 'S' ? 'checked' : ''}></td>
            <td class="text-center"><input type="radio" name="status-${s.id}" value="A" ${status === 'A' ? 'checked' : ''}></td>
            <td><input type="text" class="form-control input-keterangan" data-siswa="${s.id}" value="${keterangan}" placeholder="Keterangan"></td>
        `;
        tbody.appendChild(tr);
    });
}

function saveKehadiran() {
    const kelasId = document.getElementById('absensi-kelas').value;
    const mapelId = document.getElementById('absensi-mapel').value;
    const tanggal = document.getElementById('absensi-tanggal').value;

    if (!kelasId || !mapelId || !tanggal) return alert('Data belum lengkap!');

    const siswaInKelas = appData.siswa.filter(s => s.kelasId === kelasId);
    let count = 0;

    // Remove existing records for this day/class/mapel to avoid duplicates
    appData.kehadiran = appData.kehadiran.filter(k =>
        !(k.kelasId === kelasId && k.mapelId === mapelId && k.tanggal === tanggal)
    );

    siswaInKelas.forEach(s => {
        const statusRadio = document.querySelector(`input[name="status-${s.id}"]:checked`);
        const keteranganInput = document.querySelector(`.input-keterangan[data-siswa="${s.id}"]`);

        if (statusRadio) {
            appData.kehadiran.push({
                id: generateId(),
                tanggal,
                kelasId,
                mapelId,
                siswaId: s.id,
                status: statusRadio.value,
                keterangan: keteranganInput ? keteranganInput.value : ''
            });
            count++;
        }
    });

    saveData();
    alert(`${count} Data kehadiran berhasil disimpan!`);
}

function renderRekapKehadiranTable() {
    const kelasId = document.getElementById('rekap-absensi-kelas').value;
    const mapelId = document.getElementById('rekap-absensi-mapel').value;
    const startDate = document.getElementById('rekap-absensi-start').value;
    const endDate = document.getElementById('rekap-absensi-end').value;
    const tbody = document.getElementById('table-rekap-kehadiran-body');

    if (!kelasId || !mapelId) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Pilih Kelas dan Mata Pelajaran.</td></tr>';
        return;
    }

    const siswaInKelas = appData.siswa.filter(s => s.kelasId === kelasId);
    tbody.innerHTML = '';

    siswaInKelas.forEach((s, index) => {
        // Filter attendance records
        const records = appData.kehadiran.filter(k => {
            const isSiswa = k.siswaId === s.id;
            const isMapel = k.mapelId === mapelId;
            const isDateInRange = (!startDate || k.tanggal >= startDate) && (!endDate || k.tanggal <= endDate);
            return isSiswa && isMapel && isDateInRange;
        });

        const hadir = records.filter(r => r.status === 'H').length;
        const izin = records.filter(r => r.status === 'I').length;
        const sakit = records.filter(r => r.status === 'S').length;
        const alpha = records.filter(r => r.status === 'A').length;
        const totalPertemuan = records.length;

        const persentase = totalPertemuan > 0 ? Math.round((hadir / totalPertemuan) * 100) : 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${s.nama}</td>
            <td>${hadir}</td>
            <td>${izin}</td>
            <td>${sakit}</td>
            <td>${alpha}</td>
            <td>${persentase}%</td>
        `;
        tbody.appendChild(tr);
    });
}

function exportRekapKehadiran() {
    const table = document.querySelector('#view-rekap-kehadiran table');
    if (!table) return;

    // Use SheetJS if available, otherwise fallback to simple HTML export
    if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.table_to_book(table, { sheet: "Rekap Kehadiran" });
        XLSX.writeFile(wb, "rekap_kehadiran.xlsx");
    } else {
        const html = table.outerHTML;
        const url = 'data:application/vnd.ms-excel,' + encodeURIComponent(html);
        const downloadLink = document.createElement("a");
        document.body.appendChild(downloadLink);
        downloadLink.href = url;
        downloadLink.download = 'rekap_kehadiran.xls';
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
}

// --- MOBILE SIDEBAR ---
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

// Close sidebar when clicking a nav item on mobile
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });
});
