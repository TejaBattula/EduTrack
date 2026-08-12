const SecurityCheck = ({ secCode, onStartExam, examid }) => {
    const handleStart = () => {
      onStartExam(examid);
    };
  
    return (
      <div>
        <h2>Security Check</h2>
  
        <p>Enter the security code: {secCode}</p>
  
        <button onClick={handleStart}>
          Continue to Exam
        </button>
      </div>
    );
  };
  
  export default SecurityCheck;