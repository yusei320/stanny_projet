(function () {
    function getElement(id) {
        return document.getElementById(id);
    }

    function resetAdvancedState(advancedSectionId, toggleButtonId, collapsedHtml) {
        var section = getElement(advancedSectionId);
        var button = getElement(toggleButtonId);

        if (section) {
            section.hidden = true;
        }

        if (button && typeof collapsedHtml === 'string') {
            button.innerHTML = collapsedHtml;
            button.setAttribute('aria-expanded', 'false');
        }
    }

    function openModal(modalId, formId, advancedSectionId, toggleButtonId, collapsedHtml) {
        var modal = getElement(modalId);
        var form = formId ? getElement(formId) : null;

        if (!modal) {
            return;
        }

        if (form && typeof form.reset === 'function') {
            form.reset();
        }

        if (advancedSectionId && toggleButtonId) {
            resetAdvancedState(advancedSectionId, toggleButtonId, collapsedHtml || '');
        }

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    }

    function closeModal(modalId) {
        var modal = getElement(modalId);

        if (!modal) {
            return;
        }

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    function toggleAdvancedSection(sectionId, buttonId, expandedHtml, collapsedHtml) {
        var section = getElement(sectionId);
        var button = getElement(buttonId);

        if (!section) {
            return false;
        }

        var isExpanded = section.hidden === false;
        var nextState = !isExpanded;

        section.hidden = !nextState;

        if (button) {
            button.innerHTML = nextState ? expandedHtml : collapsedHtml;
            button.setAttribute('aria-expanded', nextState ? 'true' : 'false');
        }

        return nextState;
    }

    function switchView(view, buttonElement, gridId, tableId, gridDisplay) {
        var grid = getElement(gridId);
        var table = getElement(tableId);
        var buttons = [];

        if (buttonElement && buttonElement.parentElement) {
            buttons = Array.prototype.slice.call(buttonElement.parentElement.querySelectorAll('.view-button'));
        } else {
            buttons = Array.prototype.slice.call(document.querySelectorAll('.view-button'));
        }

        buttons.forEach(function (button) {
            button.classList.toggle('active', button === buttonElement);
        });

        if (grid) {
            grid.classList.toggle('hidden', view !== 'grid');
            grid.style.display = view === 'grid' ? (gridDisplay || 'grid') : 'none';
        }

        if (table) {
            table.classList.toggle('hidden', view !== 'table');
            table.style.display = view === 'table' ? 'block' : 'none';
        }

        return view;
    }

    function renderTableEmptyState(tableBodyId, colspan, message) {
        var tableBody = getElement(tableBodyId);

        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = [
            '<tr>',
            '  <td colspan="' + colspan + '">',
            '    <div class="empty-state">',
            '      <div>',
            '        <div class="empty-state-icon">∅</div>',
            '        <h3>Aucune donnée</h3>',
            '        <p>' + (message || 'Aucun élément à afficher pour le moment.') + '</p>',
            '      </div>',
            '    </div>',
            '  </td>',
            '</tr>'
        ].join('');
    }

    window.pageHelpers = {
        openModal: openModal,
        closeModal: closeModal,
        toggleAdvancedSection: toggleAdvancedSection,
        switchView: switchView,
        renderTableEmptyState: renderTableEmptyState
    };
})();