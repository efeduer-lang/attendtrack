/* =====================================
   DATA STORAGE
===================================== */

let classes = JSON.parse(
    localStorage.getItem("classes")
) || [];

let students = JSON.parse(
    localStorage.getItem("students")
) || [];

let attendance = JSON.parse(
    localStorage.getItem("attendance")
) || [];


/* =====================================
   SAVE DATA
===================================== */

function saveData() {

    localStorage.setItem(
        "classes",
        JSON.stringify(classes)
    );

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );

    localStorage.setItem(
        "attendance",
        JSON.stringify(attendance)
    );
}


/* =====================================
   PAGE INITIALIZATION
===================================== */

document.addEventListener("DOMContentLoaded", function () {

    loadClasses();
    loadStudents();
    loadAttendanceClasses();
    loadReports();
    updateDashboard();

    setToday();

});


/* =====================================
   CLASS REGISTRATION
===================================== */

const classForm = document.getElementById("classForm");

if (classForm) {

    classForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const name =
            document.getElementById("className").value;

        const teacher =
            document.getElementById("classTeacher").value;

        const newClass = {

            id: Date.now(),

            name: name,

            teacher: teacher

        };

        classes.push(newClass);

        saveData();

        classForm.reset();

        loadClasses();

        alert("Class added successfully.");

    });

}


/* =====================================
   LOAD CLASSES
===================================== */

function loadClasses() {

    const table =
        document.getElementById("classesTable");

    if (table) {

        table.innerHTML = "";

        classes.forEach((item, index) => {

            const studentCount =
                students.filter(
                    student => student.classId == item.id
                ).length;

            table.innerHTML += `

                <tr>

                    <td>${index + 1}</td>

                    <td>${item.name}</td>

                    <td>${item.teacher}</td>

                    <td>${studentCount}</td>

                    <td>

                        <button
                            class="btn danger"
                            onclick="deleteClass(${item.id})"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `;

        });

    }

    populateClassSelect("studentClass");

}


/* =====================================
   DELETE CLASS
===================================== */

function deleteClass(id) {

    const hasStudents =
        students.some(
            student => student.classId == id
        );

    if (hasStudents) {

        alert(
            "You cannot delete a class that has students."
        );

        return;
    }

    classes =
        classes.filter(item => item.id != id);

    saveData();

    loadClasses();

}


/* =====================================
   STUDENT REGISTRATION
===================================== */

const studentForm =
    document.getElementById("studentForm");

if (studentForm) {

    studentForm.addEventListener(
        "submit",
        function (e) {

            e.preventDefault();

            const name =
                document.getElementById(
                    "studentName"
                ).value;

            const studentId =
                document.getElementById(
                    "studentId"
                ).value;

            const classId =
                document.getElementById(
                    "studentClass"
                ).value;

            const gender =
                document.getElementById(
                    "studentGender"
                ).value;

            const student = {

                id: Date.now(),

                studentId: studentId,

                name: name,

                classId: classId,

                gender: gender

            };

            students.push(student);

            saveData();

            studentForm.reset();

            loadStudents();

            updateDashboard();

            alert(
                "Student registered successfully."
            );

        }
    );

}


/* =====================================
   POPULATE CLASS SELECT
===================================== */

function populateClassSelect(elementId) {

    const select =
        document.getElementById(elementId);

    if (!select) return;

    const firstOption =
        elementId === "reportClass"
            ? `<option value="all">All Classes</option>`
            : `<option value="">Select class</option>`;

    select.innerHTML = firstOption;

    classes.forEach(item => {

        select.innerHTML += `

            <option value="${item.id}">
                ${item.name}
            </option>

        `;

    });

}


/* =====================================
   LOAD STUDENTS
===================================== */

function loadStudents() {

    const table =
        document.getElementById("studentsTable");

    if (!table) return;

    table.innerHTML = "";

    students.forEach(student => {

        const classItem =
            classes.find(
                item => item.id == student.classId
            );

        table.innerHTML += `

            <tr>

                <td>${student.studentId}</td>

                <td>${student.name}</td>

                <td>
                    ${classItem ? classItem.name : "N/A"}
                </td>

                <td>${student.gender || "-"}</td>

                <td>

                    <button
                        class="btn danger"
                        onclick="deleteStudent(${student.id})"
                    >
                        Delete
                    </button>

                </td>

            </tr>

        `;

    });

}


/* =====================================
   DELETE STUDENT
===================================== */

function deleteStudent(id) {

    if (
        !confirm(
            "Are you sure you want to delete this student?"
        )
    ) return;

    students =
        students.filter(
            student => student.id != id
        );

    saveData();

    loadStudents();

    updateDashboard();

}


/* =====================================
   STUDENT SEARCH
===================================== */

const studentSearch =
    document.getElementById("studentSearch");

if (studentSearch) {

    studentSearch.addEventListener(
        "input",
        function () {

            const search =
                this.value.toLowerCase();

            const table =
                document.getElementById(
                    "studentsTable"
                );

            table.innerHTML = "";

            students
                .filter(student =>
                    student.name
                        .toLowerCase()
                        .includes(search) ||

                    student.studentId
                        .toLowerCase()
                        .includes(search)
                )
                .forEach(student => {

                    const classItem =
                        classes.find(
                            item =>
                                item.id ==
                                student.classId
                        );

                    table.innerHTML += `

                        <tr>

                            <td>
                                ${student.studentId}
                            </td>

                            <td>
                                ${student.name}
                            </td>

                            <td>
                                ${
                                    classItem
                                        ? classItem.name
                                        : "N/A"
                                }
                            </td>

                            <td>
                                ${student.gender || "-"}
                            </td>

                            <td>
                                <button
                                    class="btn danger"
                                    onclick="deleteStudent(${student.id})"
                                >
                                    Delete
                                </button>
                            </td>

                        </tr>

                    `;

                });

        }
    );

}


/* =====================================
   ATTENDANCE
===================================== */

function loadAttendanceClasses() {

    const select =
        document.getElementById(
            "attendanceClass"
        );

    if (!select) return;

    select.innerHTML =
        `<option value="">Select class</option>`;

    classes.forEach(item => {

        select.innerHTML += `

            <option value="${item.id}">
                ${item.name}
            </option>

        `;

    });

}


/* =====================================
   SHOW STUDENTS FOR ATTENDANCE
===================================== */

const attendanceClass =
    document.getElementById(
        "attendanceClass"
    );

if (attendanceClass) {

    attendanceClass.addEventListener(
        "change",
        function () {

            const classId = this.value;

            const table =
                document.getElementById(
                    "attendanceTable"
                );

            table.innerHTML = "";

            const classStudents =
                students.filter(
                    student =>
                        student.classId == classId
                );

            classStudents.forEach(
                (student, index) => {

                    table.innerHTML += `

                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${student.studentId}
                            </td>

                            <td>
                                ${student.name}
                            </td>

                            <td>

                                <select
                                    class="attendance-status"
                                    data-student="${student.id}"
                                >

                                    <option value="Present">
                                        Present
                                    </option>

                                    <option value="Absent">
                                        Absent
                                    </option>

                                </select>

                            </td>

                        </tr>

                    `;

                }
            );

        }
    );

}


/* =====================================
   SAVE ATTENDANCE
===================================== */

const saveAttendance =
    document.getElementById(
        "saveAttendance"
    );

if (saveAttendance) {

    saveAttendance.addEventListener(
        "click",
        function () {

            const date =
                document.getElementById(
                    "attendanceDate"
                ).value;

            const classId =
                document.getElementById(
                    "attendanceClass"
                ).value;

            if (!date || !classId) {

                alert(
                    "Please select a date and class."
                );

                return;
            }

            const statuses =
                document.querySelectorAll(
                    ".attendance-status"
                );

            statuses.forEach(select => {

                attendance.push({

                    studentId:
                        select.dataset.student,

                    classId: classId,

                    date: date,

                    status: select.value

                });

            });

            saveData();

            alert(
                "Attendance saved successfully."
            );

        }
    );

}


/* =====================================
   SET TODAY'S DATE
===================================== */

function setToday() {

    const date =
        document.getElementById(
            "attendanceDate"
        );

    if (!date) return;

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    date.value = today;

}


/* =====================================
   DASHBOARD
===================================== */

function updateDashboard() {

    const totalStudents =
        document.getElementById(
            "totalStudents"
        );

    const totalClasses =
        document.getElementById(
            "totalClasses"
        );

    if (totalStudents) {

        totalStudents.textContent =
            students.length;

    }

    if (totalClasses) {

        totalClasses.textContent =
            classes.length;

    }

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    const todayAttendance =
        attendance.filter(
            item => item.date === today
        );

    const present =
        todayAttendance.filter(
            item => item.status === "Present"
        ).length;

    const absent =
        todayAttendance.filter(
            item => item.status === "Absent"
        ).length;

    const presentElement =
        document.getElementById(
            "presentToday"
        );

    const absentElement =
        document.getElementById(
            "absentToday"
        );

    if (presentElement)
        presentElement.textContent = present;

    if (absentElement)
        absentElement.textContent = absent;

    loadClassAttendance();

}


/* =====================================
   CLASS ATTENDANCE DASHBOARD
===================================== */

function loadClassAttendance() {

    const table =
        document.getElementById(
            "classAttendanceTable"
        );

    if (!table) return;

    table.innerHTML = "";

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    classes.forEach(item => {

        const classStudents =
            students.filter(
                student =>
                    student.classId == item.id
            );

        const records =
            attendance.filter(
                record =>
                    record.classId == item.id &&
                    record.date === today
            );

        const present =
            records.filter(
                record =>
                    record.status === "Present"
            ).length;

        const absent =
            records.filter(
                record =>
                    record.status === "Absent"
            ).length;

        let percentage = 0;

        if (classStudents.length > 0) {

            percentage =
                Math.round(
                    (present /
                        classStudents.length) *
                    100
                );

        }

        table.innerHTML += `

            <tr>

                <td>${item.name}</td>

                <td>${classStudents.length}</td>

                <td class="status-present">
                    ${present}
                </td>

                <td class="status-absent">
                    ${absent}
                </td>

                <td>${percentage}%</td>

            </tr>

        `;

    });

}


/* =====================================
   REPORTS
===================================== */

const reportClass =
    document.getElementById(
        "reportClass"
    );

if (reportClass) {

    populateClassSelect("reportClass");

}


/* =====================================
   GENERATE REPORT
===================================== */

const generateReport =
    document.getElementById(
        "generateReport"
    );

if (generateReport) {

    generateReport.addEventListener(
        "click",
        function () {

            const month =
                document.getElementById(
                    "reportMonth"
                ).value;

            const selectedClass =
                document.getElementById(
                    "reportClass"
                ).value;

            if (!month) {

                alert(
                    "Please select a month."
                );

                return;

            }

            const table =
                document.getElementById(
                    "reportTable"
                );

            table.innerHTML = "";

            students
                .filter(student => {

                    if (
                        selectedClass !==
                        "all"
                    ) {

                        return (
                            student.classId ==
                            selectedClass
                        );

                    }

                    return true;

                })
                .forEach(student => {

                    const classItem =
                        classes.find(
                            item =>
                                item.id ==
                                student.classId
                        );

                    const records =
                        attendance.filter(
                            record =>

                                record.studentId ==
                                student.id &&

                                record.date.startsWith(
                                    month
                                )
                        );

                    const present =
                        records.filter(
                            record =>
                                record.status ===
                                "Present"
                        ).length;

                    const absent =
                        records.filter(
                            record =>
                                record.status ===
                                "Absent"
                        ).length;

                    const total =
                        records.length;

                    const percentage =
                        total > 0
                            ? Math.round(
                                (present /
                                    total) *
                                100
                            )
                            : 0;

                    table.innerHTML += `

                        <tr>

                            <td>
                                ${student.studentId}
                            </td>

                            <td>
                                ${student.name}
                            </td>

                            <td>
                                ${
                                    classItem
                                        ? classItem.name
                                        : "N/A"
                                }
                            </td>

                            <td class="status-present">
                                ${present}
                            </td>

                            <td class="status-absent">
                                ${absent}
                            </td>

                            <td>
                                ${total}
                            </td>

                            <td>
                                ${percentage}%
                            </td>

                        </tr>

                    `;

                });

        }
    );

}


/* =====================================
   CSV EXPORT
===================================== */

const exportCSV =
    document.getElementById(
        "exportCSV"
    );

if (exportCSV) {

    exportCSV.addEventListener(
        "click",
        function () {

            const month =
                document.getElementById(
                    "reportMonth"
                ).value;

            if (!month) {

                alert(
                    "Generate a report first."
                );

                return;

            }

            let csv =
                "Student ID,Student,Class,Present,Absent,Total Days,Attendance %\n";

            students.forEach(student => {

                const classItem =
                    classes.find(
                        item =>
                            item.id ==
                            student.classId
                    );

                const records =
                    attendance.filter(
                        record =>
                            record.studentId ==
                                student.id &&
                            record.date.startsWith(
                                month
                            )
                    );

                const present =
                    records.filter(
                        record =>
                            record.status ===
                            "Present"
                    ).length;

                const absent =
                    records.filter(
                        record =>
                            record.status ===
                            "Absent"
                    ).length;

                const total =
                    records.length;

                const percentage =
                    total > 0
                        ? Math.round(
                            (present /
                                total) *
                            100
                        )
                        : 0;

                csv +=
                    `${student.studentId},` +
                    `"${student.name}",` +
                    `"${classItem ? classItem.name : ""}",` +
                    `${present},` +
                    `${absent},` +
                    `${total},` +
                    `${percentage}%\n`;

            });

            const blob =
                new Blob(
                    [csv],
                    {
                        type:
                            "text/csv;charset=utf-8;"
                    }
                );

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                `attendance-${month}.csv`;

            link.click();

            URL.revokeObjectURL(url);

        }
    );

}


/* =====================================
   SETTINGS
===================================== */

const settingsForm =
    document.getElementById(
        "settingsForm"
    );

if (settingsForm) {

    const savedName =
        localStorage.getItem(
            "schoolName"
        );

    const savedSession =
        localStorage.getItem(
            "academicSession"
        );

    if (savedName) {

        document.getElementById(
            "schoolName"
        ).value = savedName;

    }

    if (savedSession) {

        document.getElementById(
            "academicSession"
        ).value = savedSession;

    }

    settingsForm.addEventListener(
        "submit",
        function (e) {

            e.preventDefault();

            localStorage.setItem(
                "schoolName",
                document.getElementById(
                    "schoolName"
                ).value
            );

            localStorage.setItem(
                "academicSession",
                document.getElementById(
                    "academicSession"
                ).value
            );

            alert(
                "Settings saved successfully."
            );

        }
    );

}