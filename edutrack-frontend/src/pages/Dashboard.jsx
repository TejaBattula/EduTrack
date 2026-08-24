import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

import SecurityCheck from './SecurityCheck';
import refresh from "../assets/refresh-cw.svg"
import book_check from "../assets/notepad-text.svg"
import correctper from "../assets/book-open-check.svg"
import wrongper from "../assets/circle-x.svg"
import productper from "../assets/square-dashed-kanban.svg"
import CircularProgress from '../components/chart/circleChart';
import logo from "../assets/logo.jpeg"

const Dashboard = ({
  user,
  onStartExam,
  onSwitchToAdmin,
  onLogout,
  navbar
}) => {

  const [exams, setExams] = useState([]);
  const [userResults, setUserResults] = useState({});
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [securitycode, setSecurityCode] = useState('')
  const [dashboardView, setdashboardView] = useState('dashboard')
  const [noattemptedexams, setnoattemptedexams] = useState(0)

  const [publishedResults, setPublishedResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [resultSearch, setResultSearch] = useState("");
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState("");

  const correctans = Object.values(userResults).reduce(
  (total, result) => {
    const score = Number(result?.score);

    return total + (Number.isFinite(score) ? score : 0);
  },
  0
);


// Total questions from actual exam data
const totalque = Object.entries(userResults).reduce(
  (total, [examId]) => {

    const exam = exams.find(
      (exam) =>
        String(exam.id) === String(examId) ||
        String(exam._id) === String(examId)
    );

    if (!exam) {
      return total;
    }

    let questions = [];

    try {
      questions = Array.isArray(exam.questions)
        ? exam.questions
        : JSON.parse(exam.questions || "[]");
    } catch (error) {
      questions = [];
    }

    return total + questions.length;
  },
  0
);


const wrongans = Math.max(
  0,
  totalque - correctans
);


const percentage =
  totalque > 0
    ? (correctans / totalque) * 100
    : 0;


  // ======================================================
  // FETCH EXAMS
  // ======================================================

  const fetchExams = async () => {
    try {

      setLoading(true);

      const res = await axios.get(
        'https://edutrack-cgpn.onrender.com/api/exams/all'
      );

      let examList = [];

      if (Array.isArray(res.data)) {

        examList = res.data;

        setExams(examList);

      } else {

        setExams([]);

      }


      if (user?._id && examList.length > 0) {

        const resultsMap = {};

        for (let exam of examList) {

          try {

            const checkRes = await axios.get(
              `https://edutrack-cgpn.onrender.com/api/exams/result/${exam.id}/${user._id}`
            );

            if (checkRes.data.attempted) {

              resultsMap[exam.id] =
                checkRes.data.result;

            }

          } catch (e) {

            console.error(
              `Error fetching attempt for exam ${exam.id}:`,
              e
            );

          }

        }

        setUserResults(resultsMap);

        setnoattemptedexams(
          Object.keys(resultsMap).length
        );

      }

      setError('');

    } catch (err) {

      console.error(
        'Error fetching dashboard exams:',
        err
      );

      setError(
        'Failed to load active exams.'
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    fetchExams();

  }, [user]);


  // ======================================================
  // SECURITY CODE
  // ======================================================

  const handleExamCode = (
    examid,
    securityCode
  ) => {

    setSelectedExamId(examid);

    setSecurityCode(securityCode);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  // ======================================================
  // FETCH PUBLISHED RESULTS
  // ======================================================

  const fetchPublishedResults = async () => {

    try {

      setResultsLoading(true);

      setResultsError("");

      const response = await axios.get(
        "https://edutrack-cgpn.onrender.com/api/results"
      );

    


      if (response.data.success) {

        setPublishedResults(
          response.data.data || []
        );

      } else {

        setPublishedResults([]);

      }

    } catch (error) {

      console.error(
        "Error fetching published results:",
        error
      );

      setResultsError(
        "Failed to load published results."
      );

    } finally {

      setResultsLoading(false);

    }

  };


  // ======================================================
  // NORMALIZE EXCEL RESULT DATA
  // ======================================================

  const getNormalizedResults = () => {
  if (!selectedResult) {
    return [];
  }

  let rows = selectedResult.results;

  // If results is JSON string
  if (typeof rows === "string") {
    try {
      rows = JSON.parse(rows);
    } catch (error) {
      console.error(
        "Unable to parse selectedResult.results:",
        error
      );

      return [];
    }
  }

  // Make sure results is array
  if (!Array.isArray(rows)) {
    console.error(
      "selectedResult.results is not an array:",
      rows
    );

    return [];
  }


  const normalizedRows = rows.map((row) => {

    // ==================================================
    // CASE 1: ARRAY
    // ==================================================

    if (Array.isArray(row)) {
      return {
        rank: row[0] ?? "-",
        name: row[1] ?? "-",
        studentId: row[2] ?? "-",
        dept: row[3] ?? "-",
        marks: row[4] ?? "-"
      };
    }

    // ==================================================
    // CASE 2: OBJECT
    // ==================================================

    if (row && typeof row === "object") {

      return {

        // ==============================
        // RANK
        // ==============================

        rank:
          row.rank ??
          row.Rank ??
          row.RANK ??
          row["Rank"] ??
          row["RANK"] ??
          row["S.No"] ??
          row["S.No."] ??
          row["Sl.No"] ??
          row["Sl.No."] ??
          row["S NO"] ??
          row["S NO."] ??
          "-",

        // ==============================
        // NAME
        // ==============================

        name:
          row.name ??
          row.Name ??
          row.NAME ??
          row["name"] ??
          row["Name"] ??
          row["NAME"] ??
          row["Student Name"] ??
          row["STUDENT NAME"] ??

          // Handles your OLD uploaded data
          row["UPSC - Screen Test Results"] ??

          "-",

        // ==============================
        // STUDENT ID
        // ==============================

        studentId:
          row.studentId ??
          row.studentID ??
          row.StudentId ??
          row.StudentID ??
          row.id ??
          row.ID ??
          row["ID"] ??
          row["Id"] ??
          row["Student ID"] ??
          row["Student Id"] ??
          row["STUDENT ID"] ??
          row["College ID"] ??
          row["CollegeId"] ??

          // Handles old Excel parser output
          row["__EMPTY"] ??

          "-",

        // ==============================
        // DEPARTMENT
        // ==============================

        dept:
          row.dept ??
          row.Dept ??
          row.DEPT ??
          row.department ??
          row.Department ??
          row.DEPARTMENT ??
          row["DEPT"] ??
          row["Dept"] ??
          row["Department"] ??

          // Handles old Excel parser output
          row["__EMPTY_1"] ??

          "-",

        // ==============================
        // MARKS
        // ==============================

        marks:
          row.marks ??
          row.Marks ??
          row.MARKS ??
          row.score ??
          row.Score ??
          row.SCORE ??
          row["Marks"] ??
          row["MARKS"] ??
          row["Total Marks"] ??
          row["TOTAL MARKS"] ??
          row["Marks Obtained"] ??
          "-"

      };
    }

    // ==================================================
    // INVALID ROW
    // ==================================================

    return {
      rank: "-",
      name: "-",
      studentId: "-",
      dept: "-",
      marks: "-"
    };
  });

  // ==================================================
  // REMOVE HEADER ROW IF PRESENT
  // ==================================================

  if (normalizedRows.length > 0) {

    const firstRow = normalizedRows[0];

    const headerValues = [
      String(firstRow.rank ?? "").toLowerCase().trim(),
      String(firstRow.name ?? "").toLowerCase().trim(),
      String(firstRow.studentId ?? "").toLowerCase().trim(),
      String(firstRow.dept ?? "").toLowerCase().trim(),
      String(firstRow.marks ?? "").toLowerCase().trim()
    ];

    const headerText = headerValues.join(" ");

    const isHeaderRow =
      headerText.includes("rank") ||
      headerText.includes("name") ||
      headerText.includes("dept") ||
      headerText.includes("department") ||
      headerText.includes("marks") ||
      headerText.includes("student id") ||
      headerText.includes("studentid");

    if (isHeaderRow) {
      return normalizedRows.slice(1);
    }
  }

  return normalizedRows;
};


  const normalizedResults =
    getNormalizedResults();


  // ======================================================
  // RETURN
  // ======================================================

  return (

    <div className="dashboard-container">


      {/* ==================================================
          LEFT SIDEBAR
      ================================================== */}

      <div
        className={
          navbar === true
            ? 'dashboard-left navbar'
            : 'dashboard-left'
        }
      >


        {/* DASHBOARD */}

        <div
          className={
            dashboardView === "dashboard"
              ? 'dashboard-item active'
              : 'dashboard-item'
          }

          onClick={() => {

            setdashboardView("dashboard")

          }}
        >

          <h4>
            Dashboard
          </h4>

          <ion-icon
            name="grid-outline"
          ></ion-icon>

        </div>


        {/* EXAMS */}

        <div
          className={
            dashboardView === "exams"
              ? 'dashboard-item active'
              : 'dashboard-item'
          }

          onClick={() => {

            setdashboardView("exams")

          }}
        >

          <h4>
            Exams
          </h4>

          <ion-icon
            name="book-outline"
          ></ion-icon>

        </div>


        {/* SUBMITTED */}

        <div
          className={
            dashboardView === "submitted"
              ? 'dashboard-item active'
              : 'dashboard-item'
          }

          onClick={() => {

            setdashboardView("submitted")

          }}
        >

          <h4>
            Submitted
          </h4>

          <ion-icon
            name="paper-plane-outline"
          ></ion-icon>

        </div>


        {/* RESULTS */}

        <div
          className={
            dashboardView === "results"
              ? "dashboard-item active"
              : "dashboard-item"
          }

          onClick={() => {

            setdashboardView("results");

            setSelectedResult(null);

            setResultSearch("");

            fetchPublishedResults();

          }}
        >

          <h4>
            Results
          </h4>

        </div>


        {/* MY PROFILE */}

        <div
          className={
            dashboardView === "myprofile"
              ? 'dashboard-item active'
              : 'dashboard-item'
          }

          onClick={() => {

            setdashboardView("myprofile")

          }}
        >

          <h4>
            My Profile
          </h4>

          <ion-icon
            name="person-circle-outline"
          ></ion-icon>

        </div>


        {/* USER PROFILE */}

        <div className="dashboard-user-profile">

          <ion-icon
            name="person-outline"
            onClick={() => {

              setdashboardView("myprofile")

            }}
          ></ion-icon>


          <div>

            <h4>
              {user.name}
            </h4>

            <p className='profile-email-show'>
              {user.email}
            </p>

          </div>


          <ion-icon
            name="log-out-outline"
            onClick={() => {

              onLogout()

            }}
          ></ion-icon>

        </div>

      </div>


      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="exams-section">


        {/* ==================================================
            DASHBOARD
        ================================================== */}

        {

          dashboardView === "dashboard"

            ?

            <div className="student-progress">

              <h3>
                Student Progress
              </h3>


              <div className='student-progress-box'>


                {/* ATTEMPTED */}

                <div className='progress-boxes'>

                  <div
                    className='progress-box-img'
                    style={{
                      backgroundColor: "lightblue"
                    }}
                  >

                    <img
                      src={book_check}
                      alt=""
                    />

                  </div>


                  <div className='progress-box-info'>

                    <p>
                      Attempted exams
                    </p>

                    <p>
                      {noattemptedexams}
                    </p>

                  </div>

                </div>


                {/* CORRECT */}

                <div className='progress-boxes'>

                  <div
                    className='progress-box-img'
                    style={{
                      backgroundColor: "lightgreen"
                    }}
                  >

                    <img
                      src={correctper}
                      alt=""
                    />

                  </div>


                  <div className='progress-box-info'>

                    <p>
                      Correct answers
                    </p>

                    <p>
                      {correctans}
                    </p>

                  </div>

                </div>


                {/* WRONG */}

                <div className='progress-boxes'>

                  <div
                    className='progress-box-img'
                    style={{
                      backgroundColor:
                        "rgb(255, 146, 146)"
                    }}
                  >

                    <img
                      src={wrongper}
                      alt=""
                    />

                  </div>


                  <div className='progress-box-info'>

                    <p>
                      Wrong answers
                    </p>

                    <p>
                      {wrongans}
                    </p>

                  </div>

                </div>


                {/* PRODUCTIVITY */}

                <div className='progress-boxes'>

                  <div
                    className='progress-box-img'
                    style={{
                      backgroundColor:
                        "lightskyblue"
                    }}
                  >

                    <img
                      src={productper}
                      alt=""
                    />

                  </div>


                  <div className='progress-box-info'>

                    <p>
                      Productivity
                    </p>

                    <p>

                      {
                        totalque > 0
                          ? ((correctans / totalque) * 100).toFixed(2)
                          : "0.00"
                      }%

                    </p>

                  </div>

                </div>

              </div>


              <CircularProgress
                percentage={percentage}
                totalMarksObtained={correctans}
                totalMaxMarks={totalque}
              />

            </div>

            : ""

        }


        {/* ==================================================
            ACTIVE EXAMS
        ================================================== */}

        {

          dashboardView === "dashboard" ||
          dashboardView === "exams"

            ?

            <div>

              <h3 className="section-title">

                Competitive Education Cell (CEC) Active Tests


                <div className="dashboard-banner">

                  <div>

                    <p className="banner-title">
                      Refresh
                    </p>

                  </div>


                  <button
                    onClick={() => {

                      fetchExams();

                      window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                      });

                    }}

                    className="btn-refresh"
                  >

                    <img
                      src={refresh}
                      alt=""
                    />

                  </button>

                </div>

              </h3>


              {loading && (

                <div className='loading-animation'>

                  <div className='loading-content'>

                    <p className="status-loading"></p>

                    Please wait

                  </div>

                </div>

              )}


              {error && (

                <p className="status-error">
                  {error}
                </p>

              )}


              {!loading &&
                !error &&
                exams.length === 0 && (

                  <p className="status-empty">

                    No active exams available right now.
                    Ask Admin to publish one!

                  </p>

                )}


              <div className="exams-grid">

                {exams.map((exam) => {

                  let parsedQuestions = [];

                  try {

                    parsedQuestions =
                      Array.isArray(exam.questions)
                        ? exam.questions
                        : JSON.parse(
                          exam.questions || '[]'
                        );

                  } catch (e) {

                    parsedQuestions = [];

                  }


                  const result =
                    userResults[exam.id];

                  const isAttempted =
                    !!result;


                  return (

                    <div
                      key={exam.id}
                      className={
                        `exam-card ${
                          isAttempted
                            ? 'exam-card-attempted'
                            : ''
                        }`
                      }
                    >

                      <div>

                        <div className="exam-card-header">

                          <h4 className="exam-card-title">

                            {exam.title}

                          </h4>


                          {isAttempted && (

                            <span className="badge-completed">

                              Completed

                            </span>

                          )}

                        </div>


                        <div className="exam-info">

                          <p className="exam-info-text">

                            <ion-icon
                              name="stopwatch-outline"
                            ></ion-icon>

                            Duration:

                            <b>
                              {exam.duration_minutes || 60}
                              {" "}mins
                            </b>

                          </p>


                          <p className="exam-info-text">

                            <ion-icon
                              name="help-circle-outline"
                            ></ion-icon>

                            Questions:

                            <b>
                              {parsedQuestions.length}
                              {" "}Questions
                            </b>

                          </p>


                          {isAttempted && (

                            <p className="score-badge">

                              <ion-icon
                                name="disc-outline"
                              ></ion-icon>

                              Score:

                              {" "}

                              {result.score}
                              {" / "}
                              {result.total_questions}

                              {" "}

                              ({result.percentage}%)

                            </p>

                          )}

                        </div>

                      </div>


                      <button
                        className={
                          `btn-exam-action ${
                            isAttempted
                              ? 'btn-exam-view-stats'
                              : 'btn-exam-start'
                          }`
                        }
                      >

                        {

                          isAttempted

                            ?

                            <p
                              onClick={() => {

                                onStartExam &&
                                onStartExam(
                                  exam._id
                                )

                              }}
                            >

                              <ion-icon
                                name="stats-chart-outline"
                              ></ion-icon>

                              View Statistics

                            </p>

                            :

                            <p
                              onClick={() => {

                                handleExamCode(
                                  exam._id,
                                  exam.securityCode
                                )

                              }}
                            >

                              <ion-icon
                                name="rocket-outline"
                              ></ion-icon>

                              Start Test Now

                            </p>

                        }

                      </button>

                    </div>

                  );

                })}

              </div>

            </div>

            : ""

        }


        {/* ==================================================
            SECURITY CHECK
        ================================================== */}

        {

          selectedExamId

            ?

            <SecurityCheck
              onStartExam={onStartExam}
              examid={selectedExamId}
              securityCode={securitycode}
              setSelectedExamId={setSelectedExamId}
              setSecurityCode={setSecurityCode}
            />

            : ""

        }


        {/* ==================================================
            SUBMITTED EXAMS
        ================================================== */}

        {

          dashboardView === "submitted"

            ?

            <div className='exams-grid submitted-exams-grid'>

              <h3 className="section-title">

                Competitive Education Cell (CEC) Submitted Tests


                <div className="dashboard-banner">

                  <div>

                    <p className="banner-title">
                      Refresh
                    </p>

                  </div>


                  <button
                    onClick={fetchExams}
                    className="btn-refresh"
                  >

                    <img
                      src={refresh}
                      alt=""
                    />

                  </button>

                </div>

              </h3>


              <div className='submitted-exam-items'>

                {exams.map((exam) => {

                  let parsedQuestions = [];

                  try {

                    parsedQuestions =
                      Array.isArray(exam.questions)
                        ? exam.questions
                        : JSON.parse(
                          exam.questions || '[]'
                        );

                  } catch (e) {

                    parsedQuestions = [];

                  }


                  const result =
                    userResults[exam.id];

                  const isAttempted =
                    !!result;


                  if (isAttempted) {

                    return (

                      <div
                        key={exam.id}
                        className={
                          `exam-card ${
                            isAttempted
                              ? 'exam-card-attempted '
                              : ''
                          }`
                        }
                      >

                        <div>

                          <div className="exam-card-header">

                            <h4 className="exam-card-title">

                              {exam.title}

                            </h4>


                            {isAttempted && (

                              <span className="badge-completed">

                                Completed

                              </span>

                            )}

                          </div>


                          <div className="exam-info">

                            <p className="exam-info-text">

                              <ion-icon
                                name="stopwatch-outline"
                              ></ion-icon>

                              Duration:

                              <b>
                                {exam.duration_minutes || 60}
                                {" "}mins
                              </b>

                            </p>


                            <p className="exam-info-text">

                              <ion-icon
                                name="help-circle-outline"
                              ></ion-icon>

                              Questions:

                              <b>
                                {parsedQuestions.length}
                                {" "}Questions
                              </b>

                            </p>


                            {isAttempted && (

                              <p className="score-badge">

                                <ion-icon
                                  name="disc-outline"
                                ></ion-icon>

                                Score:

                                {" "}

                                {result.score}

                                {" / "}

                                {result.total_questions}

                                {" "}

                                ({result.percentage}%)

                              </p>

                            )}

                          </div>

                        </div>


                        <button
                          onClick={() =>
                            onStartExam &&
                            onStartExam(exam._id)
                          }

                          className={
                            `btn-exam-action ${
                              isAttempted
                                ? 'btn-exam-view-stats'
                                : 'btn-exam-start'
                            }`
                          }
                        >

                          <p>

                            <ion-icon
                              name="stats-chart-outline"
                            ></ion-icon>

                            View Statistics

                          </p>

                        </button>

                      </div>

                    );

                  }

                  return null;

                })}

              </div>

            </div>

            : ""

        }


        {/* ==================================================
            RESULTS
        ================================================== */}

        {

          dashboardView === "results" && (

            <div className="student-results-section">


              <h3 className="section-title">

                Published Results

              </h3>


              {/* LOADING */}

              {resultsLoading && (

                <div className="loading-animation">

                  <div className="loading-content">

                    Loading results...

                  </div>

                </div>

              )}


              {/* ERROR */}

              {resultsError && (

                <p className="status-error">

                  {resultsError}

                </p>

              )}


              {/* RESULT LIST */}

              {!resultsLoading &&
                !resultsError &&
                !selectedResult && (

                  <div>

                    {publishedResults.length === 0 ? (

                      <div className="status-empty">

                        No results published yet.

                      </div>

                    ) : (

                      <div className="published-results-list">

                        {publishedResults.map(
                          (result, index) => (

                            <div
                              className="published-result-card"
                              key={
                                result._id ||
                                result.testName ||
                                index
                              }
                            >

                              <div>

                                <h3>

                                  {result.testName}

                                </h3>


                                <p>

                                  Results published

                                </p>

                              </div>


                              <button
                                className="btn-exam-action btn-exam-view-stats"

                                onClick={() => {


                                  setSelectedResult(result);

                                }}
                              >

                                View Results

                              </button>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                )
              }


              {/* ==================================================
                  SINGLE TEST RESULT
              ================================================== */}

              {selectedResult && (

                <div className="result-details-container">


                  {/* BACK */}

                  <button
                    className="result-back-button"

                    onClick={() => {

                      setSelectedResult(null);

                      setResultSearch("");

                    }}
                  >

                    ← Back

                  </button>


                  {/* TEST NAME */}

                  <h2>

                    {selectedResult.testName}

                  </h2>


                  <p className="result-subtitle">

                    Results

                  </p>


                  {/* SEARCH */}

                  <div className="result-search-container">

                    <input
                      type="text"

                      placeholder="Search Rank, RAME, ID, Department or Marks..."

                      value={resultSearch}

                      onChange={(e) =>
                        setResultSearch(
                          e.target.value
                        )
                      }

                      className="result-search-input"
                    />

                  </div>


                  {/* TABLE */}

                  <div className="results-table-wrapper">

                    <table className="results-table">

                      <thead>

                        <tr>

                          <th>
                            Rank
                          </th>

                          <th>
                            NAME
                          </th>

                          <th>
                            ID
                          </th>

                          <th>
                            DEPT
                          </th>

                          <th>
                            Marks
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {normalizedResults.length === 0 ? (

                          <tr>

                            <td
                              colSpan="5"
                              style={{
                                textAlign: "center",
                                padding: "20px"
                              }}
                            >

                              No student results found.

                            </td>

                          </tr>

                        ) : (

                          normalizedResults

                            .filter((row) => {

                              const search =
                                resultSearch
                                  .toLowerCase()
                                  .trim();


                              if (!search) {

                                return true;

                              }


                              const rank =
                                String(
                                  row.rank ?? ""
                                );


                              const name =
                                String(
                                  row.name ?? ""
                                );


                              const studentId =
                                String(
                                  row.studentId ?? ""
                                );


                              const dept =
                                String(
                                  row.dept ?? ""
                                );


                              const marks =
                                String(
                                  row.marks ?? ""
                                );


                              return (

                                rank
                                  .toLowerCase()
                                  .includes(search)

                                ||

                                name
                                  .toLowerCase()
                                  .includes(search)

                                ||

                                studentId
                                  .toLowerCase()
                                  .includes(search)

                                ||

                                dept
                                  .toLowerCase()
                                  .includes(search)

                                ||

                                marks
                                  .toLowerCase()
                                  .includes(search)

                              );

                            })


                            .map((row, index) => (

                              <tr
                                key={
                                  `${row.studentId}-${row.rank}-${index}`
                                }
                              >

                                <td>
                                  {row.rank}
                                </td>

                                <td>
                                  {row.name}
                                </td>

                                <td>
                                  {row.studentId}
                                </td>

                                <td>
                                  {row.dept}
                                </td>

                                <td>
                                  {row.marks}
                                </td>

                              </tr>

                            ))

                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

              )}

            </div>

          )

        }


        {/* ==================================================
            MY PROFILE
        ================================================== */}

        {

          dashboardView === "myprofile"

            ?

            <div className="user-details-card">

              <div className="user-details-header">

                <img
                  src={logo}
                  alt={user.name}
                  className="user-details-avatar"
                />


                <h2>
                  {user.name}
                </h2>


                <p>
                  {user.collegeId}
                </p>


                <span className="user-role">

                  {user.role || "Student"}

                </span>

              </div>


              <div className="user-details-info">


                {/* EMAIL */}

                <div className="user-detail-item">

                  <span className="detail-label">
                    Email
                  </span>

                  <span className="detail-value">
                    {user.email}
                  </span>

                </div>


                {/* DEPARTMENT */}

                <div className="user-detail-item">

                  <span className="detail-label">
                    Department
                  </span>

                  <span className="detail-value">
                    {user.department}
                  </span>

                </div>


                {/* SECTION */}

                <div className="user-detail-item">

                  <span className="detail-label">
                    Section
                  </span>

                  <span className="detail-value">
                    {user.section}
                  </span>

                </div>


                {/* ROLE */}

                <div className="user-detail-item">

                  <span className="detail-label">
                    Role
                  </span>

                  <span className="detail-value">

                    {user.role || "Student"}

                  </span>

                </div>


              </div>

            </div>

            : ""

        }

      </div>

    </div>

  );

};


export default Dashboard;