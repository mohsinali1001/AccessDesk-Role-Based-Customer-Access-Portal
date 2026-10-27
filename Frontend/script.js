// AccessDesk frontend: sends the API key, shows what Node.js returns.
// No permission logic here. The server decides; this page only displays the result.
$(function () {
    const $role = $('#role');
    const $rows = $('#rows');
    const $search = $('#search');
    const $badge = $('#badge');
    const $allowance = $('#allowance');
    const $credits = $('#credits');
    const $status = $('#status');
    const $table = $('#table');
    const $empty = $('#empty');
    const $count = $('#count');
    const $usagePanel = $('#usage-panel');

    let busy = false;
    const credits = {}; // last credit count the server reported, per role

    const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

    // ---------- small UI helpers ----------
    function refreshButtons() {
        $('#btn-load, #btn-search').prop('disabled', busy);
        // Cosmetic only: the server still checks the role on /api/access/summary.
        $('#btn-usage').prop('disabled', busy || $role.val() !== 'admin');
    }

    function showCredits(role) {
        const left = credits[role];
        $credits.text(left === undefined ? '\u2014' : left)
            .toggleClass('low', left !== undefined && left <= 1);
    }

    function onRoleChange() {
        const role = $role.val();
        $badge.attr('data-role', role).text(cap(role));
        $allowance.text('\u2014');
        showCredits(role);
        refreshButtons();
    }

    function showStatus(type, message, code) {
        $status.removeClass('success error info').addClass(type).prop('hidden', false).empty();
        if (type === 'info') $('<span class="spin">').appendTo($status);
        if (code) $('<span class="code">').text(code).appendTo($status);
        $('<span>').text(message).appendTo($status);
    }

    function addLog(label, code, ok) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const $li = $('<li>').toggleClass('bad', !ok);
        $('<span class="time">').text(time).appendTo($li);
        $('<span class="code">').text(code).appendTo($li);
        $('<span>').text(label).appendTo($li);
        $('#log .none').remove();
        $('#log').prepend($li);
        $('#log li:gt(5)').remove(); // keep the last 6 requests
    }

    function applyMeta(meta, text) {
        credits[meta.role] = meta.remainingCredits;
        showCredits(meta.role);
        $allowance.text(text);
    }

    // ---------- tables ----------
    function renderRows(rows, emptyMessage) {
        $table.find('thead, tbody').empty();

        if (rows.length === 0) {
            $table.prop('hidden', true);
            $empty.text(emptyMessage).prop('hidden', false);
            $count.text('0 rows');
            return;
        }

        // Columns come from the data itself. A Guest only ever receives "name".
        const columns = Object.keys(rows[0]);
        const $head = $('<tr>').appendTo($table.find('thead'));
        $('<th class="num">').text('#').appendTo($head);
        columns.forEach((col) => $('<th>').text(cap(col)).appendTo($head));

        rows.forEach((row, i) => {
            const $tr = $('<tr>').appendTo($table.find('tbody'));
            $('<td class="num">').text(i + 1).appendTo($tr);
            columns.forEach((col) => $('<td>').text(row[col]).appendTo($tr)); // .text() = no HTML injection
        });

        $empty.prop('hidden', true);
        $table.prop('hidden', false);
        $count.text(rows.length + (rows.length === 1 ? ' row' : ' rows'));
    }

    function renderUsage(roles) {
        const $body = $('#usage-table tbody').empty();
        roles.forEach((r) => {
            const $tr = $('<tr>').appendTo($body);
            const $cell = $('<td>').appendTo($tr);
            $('<span class="badge">').attr('data-role', r.role).text(cap(r.role)).appendTo($cell);
            $('<td>').text(r.maxRows).appendTo($tr);
            const $used = $('<td>').text(r.creditsUsed + ' of ' + r.totalCredits).appendTo($tr);
            const pct = Math.round((r.creditsUsed / r.totalCredits) * 100);
            $('<span class="bar">').append($('<i>').css('width', pct + '%')).appendTo($used);
            $('<td>').text(r.creditsLeft).appendTo($tr);
        });
        $usagePanel.prop('hidden', false);
    }

    // ---------- AJAX ----------
    function callApi(path, params) {
        if (busy) return null;
        busy = true;
        refreshButtons();
        showStatus('info', 'Loading\u2026');

        return $.ajax({
            url: CONFIG.API_BASE_URL + path,
            method: 'GET',
            data: params,
            dataType: 'json',
            timeout: 10000,
            headers: { 'x-api-key': CONFIG.KEYS[$role.val()] }
        }).always(function () {
            busy = false;
            refreshButtons();
        });
    }

    function handleError(jqXHR, role, label) {
        const code = jqXHR.status;
        let message;

        if (code === 0) {
            message = jqXHR.statusText === 'timeout'
                ? 'The server took too long to answer.'
                : 'Cannot reach the API. Is Node.js running on ' + CONFIG.API_BASE_URL +
                  ', and is this page opened from an allowed origin (e.g. http://127.0.0.1:5500)?';
        } else {
            message = (jqXHR.responseJSON && jqXHR.responseJSON.message) || 'Request failed';
        }

        if (code === 429) { // credits finished for this role
            credits[role] = 0;
            showCredits(role);
        }

        renderRows([], 'No records were returned.');
        showStatus('error', message, code || 'ERR');
        addLog(cap(role) + ' \u00b7 ' + label, code || 'ERR', false);
    }

    // ---------- button actions ----------
    $('#btn-load').on('click', function () {
        const requested = parseInt($rows.val(), 10);
        if (!Number.isInteger(requested) || requested < 1) {
            showStatus('error', 'Enter a whole number of rows (1 or more).');
            return;
        }
        const role = $role.val();
        const label = 'Load ' + requested;
        const req = callApi('/api/customers', { limit: requested });
        if (!req) return;

        req.done(function (res) {
            applyMeta(res.meta, res.meta.allowedRows + ' of ' + requested + ' requested');
            renderRows(res.data, 'No customers found.');
            const n = res.data.length;
            showStatus('success', 'Loaded ' + n + (n === 1 ? ' customer' : ' customers') + ' as ' + cap(role) + '.', 200);
            addLog(cap(role) + ' \u00b7 ' + label, 200, true);
        }).fail(function (jqXHR) {
            handleError(jqXHR, role, label);
        });
    });

    $('#btn-search').on('click', function () {
        const name = $search.val();
        const role = $role.val();
        const label = 'Search "' + name.trim() + '"';
        const req = callApi('/api/customers/search', { name: name });
        if (!req) return;

        req.done(function (res) {
            applyMeta(res.meta, 'Up to ' + res.meta.allowedRows + ' per search');
            renderRows(res.data, 'No customers match "' + res.meta.search + '".');
            const n = res.data.length;
            showStatus('success', 'Found ' + n + (n === 1 ? ' match' : ' matches') + ' for "' + res.meta.search + '".', 200);
            addLog(cap(role) + ' \u00b7 ' + label, 200, true);
        }).fail(function (jqXHR) {
            handleError(jqXHR, role, label);
        });
    });

    $('#btn-usage').on('click', function () {
        const role = $role.val();
        const req = callApi('/api/access/summary');
        if (!req) return;

        req.done(function (res) {
            applyMeta(res.meta, 'Usage report');
            renderUsage(res.data);
            showStatus('success', 'Usage report loaded.', 200);
            addLog(cap(role) + ' \u00b7 View usage', 200, true);
        }).fail(function (jqXHR) {
            handleError(jqXHR, role, 'View usage');
        });
    });

    $role.on('change', onRoleChange);
    $search.on('keydown', function (e) {
        if (e.key === 'Enter') $('#btn-search').trigger('click');
    });

    onRoleChange();
});