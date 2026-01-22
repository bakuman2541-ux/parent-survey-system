/******************************
 * ✅ CONFIG (API_URL Web App)
 ******************************/
const API_URL = "https://script.google.com/macros/s/AKfycbxzC-PhAnNCe9t99km0J188UoMCnjzwt4CKSIsnu9VrduWwebfAi2GCnC_hXIAN8I66/exec";

/******************************
 * ✅ Survey Questions
 * - q1..q7 = scale (4 ระดับ)
 * - q8 = text (comment)
 ******************************/
const SURVEY = [
  { id:"q1", type:"scale", text:"การสื่อสารระหว่างโรงเรียนและผู้ปกครองมีความเหมาะสม" },
  { id:"q2", type:"scale", text:"กิจกรรมการเรียนการสอนช่วยส่งเสริมพัฒนาการของนักเรียน" },
  { id:"q3", type:"scale", text:"โรงเรียนมีความปลอดภัยในด้านสถานที่และสภาพแวดล้อม" },
  { id:"q4", type:"scale", text:"ครูมีความเอาใจใส่และดูแลนักเรียนอย่างเหมาะสม" },
  { id:"q5", type:"scale", text:"การให้บริการ/อำนวยความสะดวกของโรงเรียนมีความเหมาะสม" },
  { id:"q6", type:"scale", text:"การจัดการเรียนรู้และสื่อการสอนมีคุณภาพและเหมาะสม" },
  { id:"q7", type:"scale", text:"ผู้ปกครองมีความพึงพอใจต่อการจัดการศึกษาโดยรวม" },
  { id:"q8", type:"text",  text:"ข้อ 8. ข้อเสนอแนะเพิ่มเติม (ถ้ามี)" }
];

/******************************
 * ✅ Helpers
 ******************************/
function el(id){ return document.getElementById(id); }

function showBox(id, text){
  const box = el(id);
  if(!box) return;
  box.style.display = "block";
  box.textContent = text;
}

function hideBox(id){
  const box = el(id);
  if(!box) return;
  box.style.display = "none";
  box.textContent = "";
}

function saveSurveyJSONP(payload){
  return new Promise((resolve, reject)=>{
    const callbackName = "cb_" + Date.now() + "_" + Math.floor(Math.random()*9999);

    window[callbackName] = function(data){
      delete window[callbackName];
      script.remove();
      resolve(data);
    };

    const params = new URLSearchParams();
    params.set("action", "saveSurvey");
    params.set("callback", callbackName);

    Object.keys(payload).forEach(k=>{
      params.set(k, payload[k]);
    });

    const script = document.createElement("script");
    script.src = API_URL + "?" + params.toString();
    script.onerror = ()=>reject("JSONP request failed");
    document.body.appendChild(script);
  });
}

/******************************
 * ✅ Render Survey (4 ปุ่ม แนวนอน)
 ******************************/
function buildSurvey(){
  const list = el("surveyList");
  if(!list) return;

  const scaleLabels = ["ดีมาก", "ดี", "ปานกลาง", "แย่"];
  const scaleValues = ["4", "3", "2", "1"];

  list.innerHTML = "";

  let num = 0;

  SURVEY.forEach(q=>{
    if(q.type === "scale"){
      num++;

      const card = document.createElement("div");
      card.className = "survey-item";

      card.innerHTML = `
        <div class="survey-row">
          <div class="survey-q">
            <b>ข้อ ${num}.</b> ${q.text}
          </div>

          <div class="survey-options horizontal-4">
            ${scaleLabels.map((lb, i)=>`
              <label class="opt pill">
                <input type="radio" name="${q.id}" value="${scaleValues[i]}">
                <span>${lb}</span>
              </label>
            `).join("")}
          </div>
        </div>
      `;

      list.appendChild(card);
      return;
    }

    if(q.type === "text"){
      const wrap = document.createElement("div");
      wrap.className = "survey-item";

      wrap.innerHTML = `
        <div class="survey-q"><b>${q.text}</b></div>
        <textarea id="${q.id}" class="textarea" rows="4" placeholder="พิมพ์ข้อเสนอแนะ..."></textarea>
      `;
      list.appendChild(wrap);
    }
  });
}

function readAnswers(){
  const out = {};
  SURVEY.forEach(q=>{
    if(q.type === "scale"){
      const checked = document.querySelector(`input[name="${q.id}"]:checked`);
      out[q.id] = checked ? checked.value : "";
    }else if(q.type === "text"){
      out[q.id] = (el(q.id)?.value || "").trim();
    }
  });
  return out;
}

/******************************
 * ✅ initSurveyPage (บันทึกลงชีต)
 ******************************/
function initSurveyPage(){
  // student
  let student = {};
  try{ student = JSON.parse(localStorage.getItem("student_manual") || "{}"); }catch(e){}
  if(!student.firstName || !student.lastName || !student.classroom || !student.room){
    alert("กรุณากรอกข้อมูลนักเรียนก่อน");
    location.href = "index.html";
    return;
  }

  // parent
  let parent = {};
  try{ parent = JSON.parse(localStorage.getItem("parent_info") || "{}"); }catch(e){}
  if(!parent || !parent.parentName){
    alert("กรุณากรอกข้อมูลผู้ปกครองก่อน");
    location.href = "parent-info.html";
    return;
  }

  // render survey
  buildSurvey();

  // back
  el("btnBack")?.addEventListener("click", ()=>{
    location.href = "parent-info.html";
  });

  // submit -> save to sheet
  el("btnSubmit")?.addEventListener("click", async ()=>{
    const answers = readAnswers();

    // ต้องตอบครบข้อ 1-7
    const missing = SURVEY
      .filter(x => x.type === "scale")
      .filter(x => !answers[x.id]);

    if(missing.length){
      showBox("submitError", "⚠️ กรุณาตอบให้ครบทุกข้อ (ข้อ 1-7)");
      return;
    }
    hideBox("submitError");

    const submitMsg = el("submitMsg");
    if(submitMsg) submitMsg.textContent = "กำลังบันทึกลง Google Sheet...";

    try{
      const payload = {
        // student
        studentFirstName: student.firstName,
        studentLastName: student.lastName,
        studentClass: student.classroom,
        studentRoom: student.room,

        // parent
        parentInfo: JSON.stringify(parent),

        // answers q1..q7
        answers: JSON.stringify({
          q1: answers.q1,
          q2: answers.q2,
          q3: answers.q3,
          q4: answers.q4,
          q5: answers.q5,
          q6: answers.q6,
          q7: answers.q7
        }),

        // comment column
        comment: answers.q8 || ""
      };

      const res = await saveSurveyJSONP(payload);

      if(res && res.ok){
        if(submitMsg) submitMsg.textContent = "✅ บันทึกสำเร็จ";
        location.href = "success.html";
      }else{
        if(submitMsg) submitMsg.textContent = "";
        showBox("submitError", "❌ " + (res?.message || "บันทึกไม่สำเร็จ"));
      }
    }catch(err){
      if(submitMsg) submitMsg.textContent = "";
      showBox("submitError", "❌ Error: " + err);
    }
  });
}

/******************************
 * ✅ Auto init
 ******************************/
document.addEventListener("DOMContentLoaded", ()=>{
  const page = (location.pathname.split("/").pop() || "").toLowerCase();
  if(page === "survey.html") initSurveyPage();
});
