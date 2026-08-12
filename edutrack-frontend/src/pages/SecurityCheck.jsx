import { useState } from "react";
import './securityCheck.css'
const SecurityCheck = ({ secCode, onStartExam, examid ,securityCode}) => {
    const [security,setSecurity]=useState('')
    const handleStart = () => {
        console.log(securityCode);
        
       if(securityCode===security){
        onStartExam(examid);
       }else{
        console.log("not matched...");
        
       }
      
    };
  
    return (
     <div className="security-page">
         <div className="security-card">
        <h2>Security Check</h2>
  
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