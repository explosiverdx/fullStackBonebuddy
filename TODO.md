# TODO: Enhance Patient Record in Admin Dashboard

## Overview
Enhance the PatientRecord.jsx component to include a filterable table for registered patients, showing complete vs incomplete profiles, insights cards, advanced filters/sorting, detailed modal with sections and quick actions, reminder system, and improved exports/reports.

## Steps

- [ ] Step 1: Add Quick Insights Panel at the top of PatientRecord.jsx. Create cards for Total Patients, Incomplete Profiles, Active Patients (lastLogin within 30 days), Inactive Patients. Fetch stats from /api/v1/admin/patients/stats or compute from patients data.

- [ ] Step 2: Update the Patient List Table in PatientRecord.jsx. Add/modify columns: Name/Mobile (conditional display for incomplete), Condition, Assigned Doctor, Assigned Physio, Status (✅/❌ with badge), Last Login, Actions. Highlight incomplete rows in red with ⚠ badge. Update fetchPatients to include new fields (isProfileComplete, assignedDoctor, assignedPhysio, lastLogin, createdAt).

- [ ] Step 3: Implement sorting on table headers. Add clickable headers for Name (sort by name), Last Login (desc), Newest Signup (createdAt desc). Update fetchPatients query params: sortBy, sortOrder.

- [ ] Step 4: Enhance Filters section. Add dropdowns for Profile Status (Complete/Incomplete/All), Assigned Doctor (fetch list from /api/v1/doctors), Assigned Physio (fetch from /api/v1/physios), Condition (existing or enhance). Update handleFilterChange and fetchPatients to include new params: status, doctorId, physioId.

- [ ] Step 5: Add Remind button in Actions column for incomplete profiles (isProfileComplete === false). On click, confirm and POST to /api/v1/admin/patients/{id}/remind with type (e.g., SMS). Handle success/error messages.

- [ ] Step 6: Enhance the View/Edit Modal. Restructure into sections: Basic Info (Name, Mobile, Email, DOB, Gender), Medical Info (Condition, Surgery Date, Assigned Doctor/Physio), Session Tracking (fetch from /api/v1/appointments/{patientId}, show counts and last date), Documents (list with view/download links), System Info (Signup Date, Last Login, Active/Inactive toggle - PATCH to update). Integrate with existing form for edit.

- [ ] Step 7: Implement Quick Actions in Modal: Edit Info (pre-fill existing form), Assign Doctor/Physio (dropdowns populated from fetched lists, PATCH to /api/v1/admin/patients/{id}/assign), Upload Documents (file input, POST to /api/v1/documents/{patientId}), Send Reminder (if incomplete, call remind API).

- [ ] Step 8: Enhance Export & Reports. Update handleExportPDF and handleExportExcel to include new columns (status, doctor, physio, lastLogin). Add date range inputs (startDate, endDate) and report type (new signups, active, incomplete). Update API calls to /api/v1/admin/patients/export?startDate=...&endDate=...&type=...&format=pdf/excel.

- [ ] Step 9: Add any necessary CSS styles in index.css for new elements (e.g., insight cards, badges, modal sections) using Tailwind classes where possible.

- [ ] Step 10: Test the implementation. Run dev server, navigate to /admin/patient-record, verify all new features work (table display, filters/sorting, modal sections/actions, exports). Check for errors, responsiveness, and no regressions on existing CRUD/search/pagination.

- [ ] Step 11: If backend issues (missing fields/endpoints), document and suggest updates (e.g., add isProfileComplete to patient model, new endpoints for stats/remind/assign).
