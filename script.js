/******************************
 * ✅ CONFIG
 ******************************/
const API_URL = "https://script.google.com/macros/s/AKfycbxzC-PhAnNCe9t99km0J188UoMCnjzwt4CKSIsnu9VrduWwebfAi2GCnC_hXIAN8I66/exec";

/******************************
 * ✅ Utilities
 ******************************/
function qs(key){
  return new URLSearchParams(location.search).get(key) || "";
}
function el(id){ return document.getElementById(id); }

function showBox(id, text, ok=false){
  const box = el(id);
  if(!box) return;
  box.style.display = "block";
  box.textContent = text;
  box.className = ok ? "msg ok" : "msg";
}
function hideBox(id){
  const box = el(id);
  if(!box) return;
  box.style.display = "none";
  box.textContent = "";
}

/******************************
 * ✅ Local Storage
 ******************************/
function parentKey(sid){ return `parent_${sid}`; }

function loadParentLocal(sid){
  try{ return JSON.parse(localStorage.getItem(parentKey(sid)) || "{}"); }
  catch(e){ return {}; }
}

function saveParentLocal(sid, data){
  localStorage.setItem(parentKey(sid), JSON.stringify(data || {}));
}

/******************************
 * ✅ Build parentAddress
 ******************************/
function buildParentAddress(parent){
  return [
    parent.addrNo ? `บ้านเลขที่ ${parent.addrNo}` : "",
    parent.addrMoo ? `หมู่ ${parent.addrMoo}` : "",
    parent.addrTambon ? `ตำบล ${parent.addrTambon}` : "",
    parent.addrAmphoe ? `อำเภอ ${parent.addrAmphoe}` : "",
    parent.addrProvince ? `จังหวัด ${parent.addrProvince}` : "",
    parent.addrZip ? `รหัสไปรษณีย์ ${parent.addrZip}` : ""
  ].filter(Boolean).join(" ");
}

/******************************
 * ✅ JSONP Helper (ใช้ได้ทั้ง GET Student / Save Survey)
 ******************************/
function jsonpRequest(paramsObj){
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Date.now() + "_" + Math.floor(Math.random() * 99999);

    window[cb] = (data) => {
      resolve(data);
      try { delete window[cb]; } catch(e){}
      script.remove();
    };

    const params = new URLSearchParams();
    params.set("callback", cb);

    Object.entries(paramsObj || {}).forEach(([k,v])=>{
      if(v === undefined || v === null) return;
      params.set(k, String(v));
    });

    const script = document.createElement("script");
    script.src = `${API_URL}?${params.toString()}`;

    script.onerror = () => {
      try { delete window[cb]; } catch(e){}
      script.remove();
      reject(new Error("JSONP load failed"));
    };

    document.body.appendChild(script);
  });
}

/******************************
 * ✅ Student API — JSONP
 ******************************/
function fetchStudentBySidJSONP(sid){
  return jsonpRequest({ action:"getStudent", sid });
}

/******************************
 * ✅ Save Survey — JSONP (แก้ Failed to fetch)
 ******************************/
function saveSurveyJSONP(payload){
  return jsonpRequest({
    action: "saveSurvey",
    ...payload
  });
}

/******************************
 * ✅ Render student
 ******************************/
function renderStudent(grid, student={}, sid=""){
  const sidValue   = student.sid || sid || "-";
  const nameValue  = student.name || "-";
  const classValue = student.classroom || "-";
  const roomValue  = student.room || "-";

  grid.innerHTML = `
    <div class="box"><b>เลขนักเรียน</b><div>${sidValue}</div></div>
    <div class="box"><b>ชื่อ-สกุล</b><div>${nameValue}</div></div>
    <div class="box"><b>ชั้น</b><div>${classValue}</div></div>
    <div class="box"><b>ห้อง</b><div>${roomValue}</div></div>
  `;
}

/******************************
 * ✅ Parent Form
 ******************************/
function readParentForm(){
  return {
    parentName: (el("parentName")?.value || "").trim(),
    parentJob: (el("parentJob")?.value || "").trim(),
    parentPhone: (el("parentPhone")?.value || "").trim(),
    livingWith: (el("livingWith")?.value || "").trim(),

    addrNo: (el("addrNo")?.value || "").trim(),
    addrMoo: (el("addrMoo")?.value || "").trim(),
    addrTambon: (el("addrTambon")?.value || "").trim(),
    addrAmphoe: (el("addrAmphoe")?.value || "").trim(),
    addrProvince: (el("addrProvince")?.value || "").trim(),
    addrZip: (el("addrZip")?.value || "").trim(),
  };
}

function fillParentForm(data={}){
  if(el("parentName")) el("parentName").value = data.parentName || "";
  if(el("parentJob")) el("parentJob").value = data.parentJob || "";
  if(el("parentPhone")) el("parentPhone").value = data.parentPhone || "";
  if(el("livingWith")) el("livingWith").value = data.livingWith || "";

  if(el("addrNo")) el("addrNo").value = data.addrNo || "";
  if(el("addrMoo")) el("addrMoo").value = data.addrMoo || "";
  if(el("addrTambon")) el("addrTambon").value = data.addrTambon || "";
  if(el("addrAmphoe")) el("addrAmphoe").value = data.addrAmphoe || "";
  if(el("addrProvince")) el("addrProvince").value = data.addrProvince || "";
  if(el("addrZip")) el("addrZip").value = data.addrZip || "";
}

function validateParent(data){
  if(!data.parentName) return "กรุณากรอกชื่อผู้ปกครอง";
  if(!data.parentJob) return "กรุณากรอกอาชีพ";
  if(!data.parentPhone) return "กรุณากรอกเบอร์โทรศัพท์";
  if(!/^0\d{8,9}$/.test(data.parentPhone)) return "เบอร์โทรศัพท์ไม่ถูกต้อง";
  if(!data.livingWith) return "กรุณาเลือกนักเรียนอาศัยอยู่กับใคร";
  if(!data.addrNo) return "กรุณากรอกบ้านเลขที่";
  if(!data.addrProvince) return "กรุณากรอกจังหวัด";
  if(data.addrZip && !/^\d{5}$/.test(data.addrZip)) return "เลขไปรษณีย์ต้องเป็น 5 หลัก";
  return "";
}

/******************************
 * ✅ Survey (8 ข้อ)
 ******************************/
const SURVEY = [
  { id:"q1", text:"การสื่อสารระหว่างโรงเรียนและผู้ปกครองมีความเหมาะสม", type:"scale" },
  { id:"q2", text:"กิจกรรมการเรียนการสอนช่วยส่งเสริมพัฒนาการของนักเรียน", type:"scale" },
  { id:"q3", text:"โรงเรียนมีความปลอดภัยในด้านสถานที่และสภาพแวดล้อม", type:"scale" },
  { id:"q4", text:"ครูมีความเอาใจใส่และดูแลนักเรียนอย่างเหมาะสม", type:"scale" },
  { id:"q5", text:"โดยรวมท่านพึงพอใจต่อการจัดการศึกษาของโรงเรียน", type:"scale" },
  { id:"q6", text:"อาคารสถานที่ ห้องเรียน และสิ่งอำนวยความสะดวกมีความพร้อม", type:"scale" },
  { id:"q7", text:"โรงเรียนมีการจัดกิจกรรมที่ส่งเสริมคุณธรรม จริยธรรม และระเบียบวินัย", type:"scale" },
  { id:"q8", text:"ท่านมีข้อเสนอแนะเพิ่มเติมต่อโรงเรียน", type:"text" }
];

function buildSurvey(){
  const wrap = el("surveyList");
  if(!wrap) return;

  wrap.innerHTML = "";

  SURVEY.forEach((q, i)=>{
    const div = document.createElement("div");
    div.className = "qbox";

    if(q.type === "text"){
      div.innerHTML = `
        <div class="qtitle">ข้อ ${i+1}. ${q.text}</div>
        <textarea id="${q.id}" rows="4" placeholder="พิมพ์ข้อเสนอแนะของท่าน..." style="
          width:100%;
          border:1px solid #e5e7eb;
          border-radius:14px;
          padding:12px 14px;
          outline:none;
          font-size:15px;
          resize:vertical;
        "></textarea>
      `;
      wrap.appendChild(div);
      return;
    }

    div.innerHTML = `
      <div class="qtitle">ข้อ ${i+1}. ${q.text}</div>
      <div class="radio-row">
        ${["5","4","3","2","1"].map(v=>`
          <label class="radio-pill">
            <input type="radio" name="${q.id}" value="${v}">
            <span>${({
              "5":"มากที่สุด",
              "4":"มาก",
              "3":"ปานกลาง",
              "2":"น้อย",
              "1":"น้อยที่สุด"
            })[v]}</span>
          </label>
        `).join("")}
      </div>
    `;
    wrap.appendChild(div);
  });
}

function readAnswers(){
  const answers = {};
  SURVEY.forEach(q=>{
    if(q.type === "text"){
      answers[q.id] = (el(q.id)?.value || "").trim();
    }else{
      const checked = document.querySelector(`input[name="${q.id}"]:checked`);
      answers[q.id] = checked ? checked.value : "";
    }
  });
  return answers;
}

/******************************
 * ✅ Page: student.html
 ******************************/
async function initStudentPage(){
  const sid = qs("sid");
  if(!/^\d{4}$/.test(sid)){
    alert("เลขนักเรียนไม่ถูกต้อง");
    location.href = "index.html";
    return;
  }

  const grid = el("studentGrid");
  if(grid){
    grid.innerHTML = `
      <div class="box">
        <b>กำลังดึงข้อมูลจากระบบ...</b>
        <div class="muted">กรุณารอสักครู่</div>
      </div>
    `;
  }

  try{
    const res = await fetchStudentBySidJSONP(sid);
    if(res && res.ok && res.student){
      renderStudent(grid, res.student, sid);
      hideBox("studentMsg");
    }else{
      renderStudent(grid, { sid, name:"-", classroom:"-", room:"-" }, sid);
      showBox("studentMsg", "⚠️ " + (res?.message || "ไม่พบข้อมูลนักเรียน"), false);
    }
  }catch(err){
    renderStudent(grid, { sid, name:"-", classroom:"-", room:"-" }, sid);
    showBox("studentMsg", "⚠️ ดึงข้อมูลไม่สำเร็จ: " + err, false);
  }

  el("btnNextToParent")?.addEventListener("click", ()=>{
    location.href = `parent-info.html?sid=${encodeURIComponent(sid)}`;
  });

  el("btnBack")?.addEventListener("click", ()=>{
    location.href = "index.html";
  });
}

/******************************
 * ✅ Page: parent-info.html
 ******************************/
function initParentInfoPage(){
  const sid = qs("sid");
  if(!/^\d{4}$/.test(sid)){
    alert("เลขนักเรียนไม่ถูกต้อง");
    location.href = "index.html";
    return;
  }

  fillParentForm(loadParentLocal(sid));
  const btnNext = el("btnNext");

  function updateState(){
    const data = readParentForm();
    saveParentLocal(sid, data);

    const err = validateParent(data);
    if(err){
      btnNext.disabled = true;
      hideBox("formMsg");
    }else{
      btnNext.disabled = false;
      showBox("formMsg", "✅ ข้อมูลครบแล้ว สามารถไปทำแบบสอบถามได้", true);
    }
  }

  document.querySelectorAll("input, select").forEach(x=>{
    x.addEventListener("input", updateState);
    x.addEventListener("change", updateState);
  });

  el("parentPhone")?.addEventListener("input", ()=>{
    el("parentPhone").value = el("parentPhone").value.replace(/\D/g,"").slice(0,10);
  });

  el("addrZip")?.addEventListener("input", ()=>{
    el("addrZip").value = el("addrZip").value.replace(/\D/g,"").slice(0,5);
  });

  el("btnNext")?.addEventListener("click", ()=>{
    const data = readParentForm();
    const err = validateParent(data);
    if(err){
      showBox("formMsg", "⚠️ " + err, false);
      return;
    }
    location.href = `survey.html?sid=${encodeURIComponent(sid)}`;
  });

  el("btnBack")?.addEventListener("click", ()=>{
    location.href = `student.html?sid=${encodeURIComponent(sid)}`;
  });

  updateState();
}

/******************************
 * ✅ Page: survey.html
 ******************************/
function initSurveyPage(){
  const sid = qs("sid");
  if(!/^\d{4}$/.test(sid)){
    alert("เลขนักเรียนไม่ถูกต้อง");
    location.href = "index.html";
    return;
  }

  const parent = loadParentLocal(sid);
  if(!parent.parentName){
    alert("กรุณากรอกข้อมูลผู้ปกครองก่อน");
    location.href = `parent-info.html?sid=${encodeURIComponent(sid)}`;
    return;
  }

  buildSurvey();

  el("btnBack")?.addEventListener("click", ()=>{
    location.href = `parent-info.html?sid=${encodeURIComponent(sid)}`;
  });

  el("btnSubmit")?.addEventListener("click", async ()=>{
    const answers = readAnswers();

    // ต้องตอบข้อ 1-7
    const missing = SURVEY
      .filter(q => q.type === "scale")
      .filter(q => !answers[q.id]);

    if(missing.length){
      showBox("submitError", "⚠️ กรุณาตอบให้ครบทุกข้อ (ข้อ 1-7)", false);
      return;
    }
    hideBox("submitError");

    const submitMsg = el("submitMsg");
    if(submitMsg) submitMsg.textContent = "กำลังบันทึก...";

    try{
      const parentData = loadParentLocal(sid);

      const payload = {
        sid: sid,
        parentName: parentData.parentName || "",
        parentJob: parentData.parentJob || "",
        parentPhone: parentData.parentPhone || "",
        livingWith: parentData.livingWith || "",
        parentAddress: buildParentAddress(parentData),
        answers: JSON.stringify({
          q1: answers.q1,
          q2: answers.q2,
          q3: answers.q3,
          q4: answers.q4,
          q5: answers.q5,
          q6: answers.q6,
          q7: answers.q7
        }),
        suggestion: answers.q8 || ""
      };

      // ✅ ส่งแบบ JSONP (ไม่ติด CORS)
      const res = await saveSurveyJSONP(payload);

      if(res && res.ok){
        if(submitMsg) submitMsg.textContent = "✅ บันทึกสำเร็จ";
        location.href = `success.html?sid=${encodeURIComponent(sid)}`;
      }else{
        if(submitMsg) submitMsg.textContent = "";
        showBox("submitError", "❌ " + (res?.message || "บันทึกไม่สำเร็จ"), false);
      }
    }catch(err){
      if(submitMsg) submitMsg.textContent = "";
      showBox("submitError", "❌ Error: " + err, false);
    }
  });
}

/******************************
 * ✅ Auto init
 ******************************/
document.addEventListener("DOMContentLoaded", ()=>{
  const page = (location.pathname.split("/").pop() || "").toLowerCase();
  if(page === "student.html") initStudentPage();
  if(page === "parent-info.html") initParentInfoPage();
  if(page === "survey.html") initSurveyPage();
});
