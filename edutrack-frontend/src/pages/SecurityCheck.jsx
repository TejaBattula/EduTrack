import { useState } from "react";
import './securityCheck.css'
const SecurityCheck = ({ secCode, onStartExam, examid ,securityCode,setSelectedExamId,setSecurityCode}) => {
    const [security,setSecurity]=useState('')
    const [loading,setloading]=useState(false)
    const [error,seterror]=useState(false)
    const handleStart = () => {
        console.log(securityCode);
        setloading(true)
       if(securityCode===security){
        onStartExam(examid);
       }else{
        console.log("not matched...");
        setloading(false)
        seterror(true)
       }
      setloading(false)
    };
  
    return (
     <div className="security-page">
         <div className="security-card">
         <ion-icon name="close-outline" onClick={()=>{setSelectedExamId('')
          setSecurityCode('')
         }}></ion-icon>
        <h2>Security Check</h2>
         {error===true?<p className="code-error">Please enter the valid code</p>:""}
        <p>Enter the security code: {secCode}</p>
        <input type="text" placeholder="enter the code.." name="securityCode" onChange={(e)=>{setSecurity(e.target.value)}}/>
        <button onClick={handleStart}>
          Continue to Exam
        </button>
      </div>
     </div>
    );
  };
  
  export default SecurityCheck;