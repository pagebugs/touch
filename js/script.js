// js/script.js
// -------------------------------------------
// TOUCH AD 통합 스크립트 (tt.html + r.html)
// -------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // ============================================================
  // [tt.html] 입력폼 페이지
  // ============================================================
  if (document.getElementById("multi-step-form")) {
    // 👉 여기에는 앞서 정리한 tt.html 전체 코드가 이미 들어 있음
    // (multi-step form, postcode API, fetchData, fetchSubmitForm 등)

    // --- 1. 변수 선언 ---
    const formStepsContainer = document.querySelector(".form-steps-container");
    const formDots = document.querySelectorAll(".form-indicator .step-dot");
    const formSteps = document.querySelectorAll(".form-step");
    const prevButton = document.querySelector(".prev-button");
    const nextButton = document.querySelector(".next-button");
    const submitButton = document.querySelector(".submit-button");
    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const emailInput = document.getElementById("email");
    const hospitalNameInput = document.getElementById("hospital-name");
    const specialtySelect = document.getElementById("specialty");
    const addressBaseInput = document.getElementById("address-base");
    const addressDetailInput = document.getElementById("address-detail");
    const privacyConsentCheckbox = document.getElementById("privacy-consent");
    const genderSelect = document.getElementById("gender");
    const ageSelect = document.getElementById("age");
    const postcodeSearchButton = document.querySelector(".search-button");
    let postcode = "";

    let currentStep = 0;
    const totalSteps = 4;
    let isTimedOut = false;  // 타임아웃 여부 플래그
    let msgInterval;         // 메시지 순환 interval ID

    // --- 2. 단계 전환 ---
    function updateForm() {
      formStepsContainer.style.transform = `translateX(-${(currentStep * 100) / totalSteps}%)`;
      formDots.forEach((dot, index) => dot.classList.toggle("active", index === currentStep));
      prevButton.style.display = currentStep > 0 ? "inline-block" : "none";
      nextButton.style.display = currentStep < totalSteps - 1 ? "inline-block" : "none";
      submitButton.style.display = currentStep === totalSteps - 1 ? "inline-block" : "none";
      checkButtonState();
    }

    // --- 3. 단계 유효성 검사 ---
    function validateStep() {
      let isValid = true;
      if (currentStep === 0) {
        if (!nameInput.value.trim() || !phoneInput.value.trim() || !phoneInput.validity.valid) isValid = false;
        if (emailInput.value.trim() !== "" && !emailInput.validity.valid) isValid = false;
      } else if (currentStep === 1) {
        if (!hospitalNameInput.value.trim() || !specialtySelect.value.trim()) isValid = false;
      } else if (currentStep === 2) {
        if (!addressBaseInput.value.trim() || !addressDetailInput.value.trim()) isValid = false;
      } else if (currentStep === 3) {
        if (!genderSelect.value.trim() || !ageSelect.value.trim()) isValid = false;
        if (!privacyConsentCheckbox.checked) isValid = false;
      }
      return isValid;
    }

    function checkButtonState() {
      const isStepValid = validateStep();
      const targetButton = currentStep < totalSteps - 1 ? nextButton : submitButton;
      if (isStepValid) {
        targetButton.classList.remove("disabled");
        targetButton.disabled = false;
      } else {
        targetButton.classList.add("disabled");
        targetButton.disabled = true;
      }
    }

    // --- 4. 다음 주소 API ---
    function openPostcodeSearch() {
      new daum.Postcode({
        oncomplete: function (data) {
          let roadAddr = data.roadAddress;
          let extraRoadAddr = "";
          if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) extraRoadAddr += data.bname;
          if (data.buildingName !== "") extraRoadAddr += extraRoadAddr !== "" ? ", " + data.buildingName : data.buildingName;
          if (extraRoadAddr !== "") extraRoadAddr = " (" + extraRoadAddr + ")";
          postcode = data.zonecode;
          addressBaseInput.value = `${roadAddr}${extraRoadAddr}`;
        },
      }).open();
    }

    // --- 5. API 호출 및 결과 저장 ---
    async function fetchData() {
      const overlay = document.getElementById("loadingOverlay");
      const resultEl = document.getElementById("result");

      const apiRequestData = [
        { card_dong_nm: postcode, sex: "M,F,Z", age: "A,B,C,D,E,F,G", card_sub: specialtySelect.value },
        { card_dong_nm: postcode, sex: "M,F,Z", age: ageSelect.value, card_sub: specialtySelect.value },
        { card_dong_nm: postcode, sex: `${genderSelect.value},Z`, age: "A,B,C,D,E,F,G", card_sub: specialtySelect.value },
      ];

      try {
        overlay.style.display = "flex";
        const response = await fetch("https://t.at.runcomm.co.kr/service/v1/post/health/care", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiRequestData),
        });
        const apiData = await response.json();

        const partnerOption = specialtySelect.options[specialtySelect.selectedIndex];
        const genderOption = genderSelect.options[genderSelect.selectedIndex];
        const ageOption = ageSelect.options[ageSelect.selectedIndex];
        const localData = {
          hospitalName: hospitalNameInput.value,
          generalData: {
            gender: genderOption.getAttribute("name"),
            age: ageOption.getAttribute("name"),
            partnerCd: partnerOption.getAttribute("name"),
            addressBase: addressBaseInput.value,      // ✅ 추가
            addressDetail: addressDetailInput.value   // ✅ 추가
          },
          resData: apiData,
        };
    localStorage.setItem("touchadData", JSON.stringify(localData));
    // 필요하면 개별 키로도 따로 저장 (호환성용)
    localStorage.setItem("address-base", addressBaseInput.value);
    localStorage.setItem("address-detail", addressDetailInput.value);

    // ✅ 성공 시에는 overlay 유지 → 곧바로 r.html 이동
    if (!isTimedOut) {
  const token = localStorage.getItem("user_token");
  if (token) {
    window.location.href = `r.html?token=${encodeURIComponent(token)}`;
  } else {
    window.location.href = "r.html"; // fallback
  }
}

    } catch (err) {
      console.error("API 호출 오류:", err);
      // ✅ 실패 시 오버레이는 닫지 않고, 실패 메시지로 교체
      document.getElementById("waveLoader").style.display = "none";
      document.getElementById("processingMessages").style.display = "none";
      document.getElementById("errorMessage").style.display = "block";
    }
    // --- [오버레이] 실패 재시도 버튼 --- //
      const retryBtn = document.getElementById("retryBtn");
      if (retryBtn) {
        retryBtn.addEventListener("click", async () => {
          // 실패 메시지 감추고 다시 파형+메시지 보여줌
          document.getElementById("errorMessage").style.display = "none";
          document.getElementById("waveLoader").style.display = "flex";
          document.getElementById("processingMessages").style.display = "block";

          isTimedOut = false;     // 타임아웃 플래그 초기화
          startOverlayTimeout();  // 다시 30초 타이머 시작
          await fetchData();      // ✅ Runcomm API만 재호출
        });
      }
    }

    // --- 6. 이벤트 리스너 ---
    postcodeSearchButton.addEventListener("click", openPostcodeSearch);
    nextButton.addEventListener("click", () => { if (currentStep < totalSteps - 1 && validateStep()) { currentStep++; updateForm(); }});
    prevButton.addEventListener("click", () => { if (currentStep > 0) { currentStep--; updateForm(); }});
    document.querySelectorAll("#multi-step-form input, #multi-step-form select").forEach((input) => input.addEventListener("input", checkButtonState));
    privacyConsentCheckbox.addEventListener("change", checkButtonState);

    // 오버레이 DOM 잡기
    const loadingOverlay = document.getElementById("loadingOverlay");

    submitButton.addEventListener("click", async () => {
      if (validateStep()) {
        isTimedOut = false; // ✅ 새 요청 시작할 때 항상 초기화
        submitButton.disabled = true;
        submitButton.textContent = "처리 중...";

        // ✅ API 시작 전에 오버레이 표시
        if (loadingOverlay) {
          loadingOverlay.style.display = "flex";
          startOverlayTimeout(); // <-- 여기서 타임아웃 타이머 시작
        }

        try {
          await fetchSubmitForm();   // Google Sheets 저장
          await fetchData();         // Runcomm API 호출

          clearOverlayTimeout();     // ✅ 성공 시 타이머 해제
          // 성공하면 r.html로 이동 → 새 페이지에서 오버레이 종료됨
        } catch (error) {
          console.error("제출 처리 오류:", error);
          submitButton.disabled = false;
          submitButton.textContent = "제출";

          clearOverlayTimeout(); // 타임아웃 해제
          // 오버레이 닫기 대신 실패 메시지 표시
          document.getElementById("waveLoader").style.display = "none";
          document.getElementById("processingMessages").style.display = "none";
          document.getElementById("errorMessage").style.display = "block";
        }
      } else {
        alert("필수 정보를 모두 입력하고 개인정보 수집에 동의해주세요.");
      }
    });
// --- 7. Google Sheet 연동 (0923 수정본) ---
async function fetchSubmitForm() {
  // ✅ 선택된 옵션 요소
  const specialtyOption = specialtySelect.options[specialtySelect.selectedIndex];
  const ageOption = ageSelect.options[ageSelect.selectedIndex];

  // ✅ 클라이언트 IP 조회
  let clientIp = "";
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();
    clientIp = ipData.ip;
  } catch (err) {
    console.warn("IP 조회 실패:", err);
  }

  // ✅ Google Sheet 저장
  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ctaForm: false,
      name: nameInput.value,
      phone: phoneInput.value,
      email: emailInput.value,
      "hospital-name": hospitalNameInput.value,
      specialty: specialtyOption.getAttribute("name"),
      "address-base": addressBaseInput.value,
      "address-detail": addressDetailInput.value,
      gender: genderSelect.value,      // 성별 코드값 (M/F)
      age: ageOption.getAttribute("name"),
      "privacy-consent": privacyConsentCheckbox.checked,
      ip: clientIp
    }),
  });

  const result = await response.json();
  if (result.uuid) {
    // ✅ 시트 저장 후 로컬스토리지에 값 저장
    localStorage.setItem("user_uuid", result.uuid);
    localStorage.setItem("user_uid", result.uid);

    // 📌 CTA 모달 value 세팅용
    localStorage.setItem("name", nameInput.value);
    localStorage.setItem("phone", phoneInput.value);
    localStorage.setItem("hospital-name", hospitalNameInput.value);
    localStorage.setItem("email", emailInput.value);
  }

  // 📌 토큰 저장 (신규 추가)
if (result.token) {
  localStorage.setItem("user_token", result.token);
}

}
    // --- 8. 이메일 도메인 입력/선택 토글 ---
    const emailDomainInput = document.getElementById("email-domain-input");
    const emailDomainSelect = document.getElementById("email-domain-select");
    const emailDomainToggle = document.getElementById("email-domain-toggle");

    if (emailDomainInput && emailDomainSelect && emailDomainToggle) {
      // '▼' 버튼 클릭 시 select 박스로 전환
      emailDomainToggle.addEventListener("click", () => {
        emailDomainInput.style.display = "none";
        emailDomainToggle.style.display = "none";
        emailDomainSelect.style.display = "block";
        emailDomainSelect.focus();
      });

      // select 변경 시 input 값 갱신 후 UI 원복
      emailDomainSelect.addEventListener("change", (event) => {
        const selectedValue = event.target.value;
        emailDomainInput.value = selectedValue === "self" ? "" : selectedValue;
        emailDomainSelect.style.display = "none";
        emailDomainInput.style.display = "block";
        emailDomainToggle.style.display = "block";
      });
    }

    // --- 9. 우측 스크롤 인디케이터 ---
    const mainContainer = document.querySelector(".scroll-container");
    const sections = document.querySelectorAll(".scroll-section");
    const sectionDots = document.querySelectorAll(".scroll-indicator .scroll-dot");

    function handleScrollIndicator() {
      const scrollTop = mainContainer.scrollTop;
      let currentSectionId = "hero-section";
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          currentSectionId = section.id;
        }
      });
      sectionDots.forEach((dot) => {
        dot.classList.toggle("active", dot.dataset.section === currentSectionId);
      });
    }

    if (mainContainer) {
      mainContainer.addEventListener("scroll", handleScrollIndicator);
    }


    updateForm(); // 초기화
  }

  // ============================================================
  // [r.html] 결과 페이지
  // ============================================================
  if (document.getElementById("intro")) {
    // --- 1. 변수 선언 ---
    const mainContainer = document.querySelector(".scroll-container");
    const sections = document.querySelectorAll(".scroll-section");
    const dots = document.querySelectorAll(".scroll-dot");
    const parallaxImage = document.querySelector(".parallax__image");
    const tableRows = document.querySelectorAll(".data-table tbody tr");
    const logo = document.querySelector(".site-logo");
    const floatingButton = document.querySelector(".floating-cta");
    const footer = document.querySelector(".site-footer");
    const { hospitalName, generalData, resData } = JSON.parse(localStorage.getItem("touchadData"));
    const introLeft = document.querySelector(".intro__left-pane");
    const userName = localStorage.getItem("name") || "";  // 이름 불러오기

    // 비율 계산
    const agePercent = Math.round((resData[1].target / resData[0].target) * 100, 1);
    const genderPercent = Math.round((resData[2].target / resData[0].target) * 100, 1);
    introLeft.innerHTML = `<span class="line"><span class="uspH">${userName}</sapn>원장님!</span>`;

    const span = document.createElement("span");
    span.className = "line";
    span.innerHTML = `지난 4주간, <span class="uspH">${hospitalName}</span> 반경 1km 내에서 <span class="uspH">${resData[0].target.toLocaleString()}</span>건의 <span class="uspH">${generalData.partnerCd} 관련 소비</span>가 있었습니다. 이 중 ${generalData.age}는 <span class="uspH">${isNaN(agePercent) ? 0 : agePercent}%</span>, 그들 중 ${generalData.gender}은 <span class="uspH">${isNaN(genderPercent) ? 0 : genderPercent}%</span>입니다.`;
    introLeft.appendChild(span);

    // isMobile 체크
    const isMobile = window.innerWidth <= 768;

    // PC 전용 변수
    const mouseFollower = document.getElementById("mouse-follower");
    let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;
    const speed = 0.15;

    // 패럴랙스 관련 변수
    let heightDifference = 0, zoneStarts = 0, zoneEnds = 0, zoneHeight = 0;

    // --- 2. 함수 정의 ---
    function calculateParallaxValues() {
      const mapSection = document.getElementById("map-section");
      const testimonialsSection = document.getElementById("testimonials");
      if (isMobile || !parallaxImage || !mapSection || !testimonialsSection) return;
      heightDifference = parallaxImage.offsetHeight - mapSection.offsetHeight;
      zoneStarts = mapSection.offsetTop;
      zoneEnds = testimonialsSection.offsetTop + testimonialsSection.offsetHeight;
      zoneHeight = zoneEnds - zoneStarts;
    }

    function handleScroll() {
      const scrollTop = mainContainer.scrollTop;
      const viewportHeight = window.innerHeight;

      // 패럴랙스
      if (!isMobile && zoneHeight > 0 && scrollTop >= zoneStarts - viewportHeight && scrollTop <= zoneEnds) {
        const scrollInZone = scrollTop - zoneStarts + viewportHeight;
        const progress = scrollInZone / (zoneHeight + viewportHeight);
        const clampedProgress = Math.max(0, Math.min(1, progress));
        if (heightDifference > 0) {
          parallaxImage.style.transform = `translateY(${clampedProgress * -heightDifference}px)`;
        }
      }

      // 인디케이터
      if (!isMobile) {
        const scrollMidpoint = mainContainer.clientHeight / 2;
        let currentSectionId = "intro";
        let minDiff = Infinity;
        sections.forEach((section) => {
          const rect = section.getBoundingClientRect();
          const diff = Math.abs(rect.top + rect.height / 2 - scrollMidpoint);
          if (diff < minDiff) {
            minDiff = diff;
            currentSectionId = section.id;
          }
        });
        dots.forEach((dot) => dot.classList.toggle("active", dot.dataset.section === currentSectionId));
      }

      // 배경색 전환
      const introSection = document.querySelector("#intro");
      const introBottom = (introSection?.offsetTop || 0) + (introSection?.offsetHeight || 0);
      if (scrollTop >= introBottom - viewportHeight * 0.4) {
        mainContainer.style.backgroundColor = "white";
        mainContainer.style.color = "#222";
      } else {
        mainContainer.style.backgroundColor = "black";
        mainContainer.style.color = "white";
      }
    }

    function animateFollower() {
      if (isMobile) return;
      const distX = mouseX - followerX;
      const distY = mouseY - followerY;
      followerX += distX * speed;
      followerY += distY * speed;
      if (mouseFollower) {
        mouseFollower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;
      }
      requestAnimationFrame(animateFollower);
    }

    // --- 3. 이벤트 리스너 ---
    if (logo) {
      logo.addEventListener("click", (e) => {
        e.preventDefault();
        mainContainer.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    mainContainer.addEventListener("scroll", handleScroll);

    // 테이블 인터랙션
    if (isMobile) {
      const quoteOverlay = document.querySelector(".quote-overlay-row");
      if (tableRows.length > 0 && quoteOverlay) {
        let currentIndex = 0;
        const quoteDuration = 3000;
        const intervalTime = 4000;

        setInterval(() => {
          const currentRow = tableRows[currentIndex];
          const nextIndex = (currentIndex + 1) % tableRows.length;
          const nextRow = tableRows[nextIndex];

          quoteOverlay.textContent = `"${currentRow.getAttribute("data-quote")}"`;
          quoteOverlay.style.top = `${currentRow.offsetTop}px`;
          quoteOverlay.style.height = `${currentRow.offsetHeight}px`;
          quoteOverlay.style.width = `${currentRow.offsetWidth}px`;
          quoteOverlay.classList.add("visible");

          setTimeout(() => {
            quoteOverlay.style.top = `${nextRow.offsetTop}px`;
          }, quoteDuration - 600);

          setTimeout(() => {
            quoteOverlay.classList.remove("visible");
          }, quoteDuration);

          currentIndex = nextIndex;
        }, intervalTime);
      }
    } else {
      const tableContainer = document.querySelector(".table-container");
      const quoteOverlay = document.querySelector(".quote-overlay-row");
      if (tableContainer && quoteOverlay) {
        const tbody = tableContainer.querySelector("tbody");
        tbody?.addEventListener("mouseenter", () => { quoteOverlay.style.opacity = "1"; });
        tbody?.addEventListener("mouseleave", () => { quoteOverlay.style.opacity = "0"; });
        tableRows.forEach((row) => {
          row.addEventListener("mouseenter", () => {
            quoteOverlay.textContent = `"${row.getAttribute("data-quote")}"`;
            quoteOverlay.style.top = `${row.offsetTop}px`;
            quoteOverlay.style.height = `${row.offsetHeight}px`;
            quoteOverlay.style.width = `${row.offsetWidth}px`;
          });
        });
      }
    }

    // 스크롤 애니메이션
    const animationObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".animate-on-scroll").forEach((el) => animationObserver.observe(el));

    // 반응형 비디오 로딩
    function loadResponsiveVideo() {
      const video = document.querySelector(".intro__video-wrapper video");
      if (!video) return;

      const isNowMobile = window.innerWidth <= 768;
      const newSrc = isNowMobile ? video.dataset.mobileSrc : video.dataset.desktopSrc;
      const source = video.querySelector("source");

      if (newSrc && source.getAttribute("src") !== newSrc) {
        source.setAttribute("src", newSrc);
        video.load();

        // 강제로 재생 시도 (iOS 대응)
        video.play().catch(err => console.log("autoplay blocked:", err));
      }
    }

    // 최초 실행 + 리사이즈
    window.addEventListener("load", loadResponsiveVideo);
    window.addEventListener("resize", loadResponsiveVideo);

    // 애니메이션 끝난 뒤 보이게
const lines = document.querySelectorAll(".animate-lines .line");
const lastLine = lines[lines.length - 1];

if (lastLine) {
  lastLine.addEventListener("animationend", () => {
    document.getElementById("map-wrapper")?.classList.add("visible");
  }, { once: true });
}

    // PC 전용 초기화
    if (!isMobile) {
      if (parallaxImage) {
        parallaxImage.onload = calculateParallaxValues;
        window.addEventListener("resize", calculateParallaxValues);
        if (parallaxImage.complete) calculateParallaxValues();
      }
      window.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });
      animateFollower();
    }

    // 플로팅 버튼 & 푸터 충돌 감지
    if (floatingButton) {
      if (isMobile) {
        let collapseTimer;
        floatingButton.addEventListener("click", (e) => {
          e.preventDefault();
          floatingButton.classList.add("expanded");
          clearTimeout(collapseTimer);
          collapseTimer = setTimeout(() => {
            floatingButton.classList.remove("expanded");
          }, 3000);
        });
      } else {
        floatingButton.addEventListener("mouseenter", () => floatingButton.classList.add("expanded"));
        floatingButton.addEventListener("mouseleave", () => floatingButton.classList.remove("expanded"));
      }

      if (footer) {
        const footerObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const footerHeight = footer.offsetHeight;
              floatingButton.style.position = "absolute";
              floatingButton.style.bottom = `${footerHeight + 20}px`;
            } else {
              floatingButton.style.position = "fixed";
              floatingButton.style.bottom = "40px";
            }
          });
        }, { threshold: 0 });
        footerObserver.observe(footer);
      }
    }

// --- 4. CTA 버튼 Google Sheet 업데이트 (0923 추가) ---
const ctaForm = document.getElementById("ctaForm");
const ctaOverlay = document.getElementById("ctaOverlay");
const cancelBtn = document.querySelector(".cancel-btn");

function attachCTAEvent(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.addEventListener("click", async (e) => {
      e.preventDefault();
      const uuid = localStorage.getItem("user_uuid");
      if (!uuid) {
        alert("사용자 정보가 없습니다. 처음부터 다시 진행해주세요.");
        return;
      }
      try {
        const response = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uuid: uuid, request: "Y" }),
        });
        const result = await response.json();
        if (result.result === "updated") {
          // ✅ localStorage 값으로 모달 input.value 세팅
          document.getElementById("ctaName").value = localStorage.getItem("name") || "";
          document.getElementById("ctaPhone").value = localStorage.getItem("phone") || "";
          document.getElementById("ctaHospital").value = localStorage.getItem("hospital-name") || "";
          document.getElementById("ctaEmail").value = localStorage.getItem("email") || "";

          // 모달 열기
          document.getElementById("ctaModal").style.display = "flex";
        } else {
          alert("문의 요청 처리에 문제가 발생했습니다.");
        }
      } catch (err) {
        console.error("API 호출 오류:", err);
        alert("서버 연결에 실패했습니다.");
      }
    });
  });
}

// 2) 제출 버튼 → CTA_Responses 탭 저장
ctaForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const uuid = localStorage.getItem("user_uuid");

  const name = document.getElementById("ctaName").value.trim();
  const phone = document.getElementById("ctaPhone").value.trim();
  const hospital = document.getElementById("ctaHospital").value.trim();
  const email = document.getElementById("ctaEmail").value.trim();

  if (!name || !phone || !hospital) {
    alert("이름, 전화번호, 병원명은 필수 입력 항목입니다.");
    return;
  }

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uuid,
        name,
        phone,
        "hospital-name": hospital, // ✅ hospital-name 키 사용
        email,
        ctaForm: true              // 📌 CTA 플래그
      }),
    });
    const data = await res.json();

    if (data.result === "inserted") {
      document.getElementById("ctaModal").style.display = "none";
      ctaOverlay.style.display = "flex";   // ✅ 접수완료 오버레이 표시
      setTimeout(() => { ctaOverlay.style.display = "none"; }, 4000);
    } else {
      alert("저장 중 문제가 발생했습니다.");
    }
  } catch (err) {
    console.error("저장 오류:", err);
    alert("서버 연결에 실패했습니다.");
  }
});

// 3) 취소 버튼
cancelBtn?.addEventListener("click", () => {
  document.getElementById("ctaModal").style.display = "none";
});

// ✅ 두 개 CTA 버튼 모두 이벤트 연결
attachCTAEvent(".floating-cta");
attachCTAEvent(".cta__button");

    // 모달 닫기
    const modal = document.getElementById("ctaModal");
    const closeBtn = document.querySelector(".modal__close");
    if (modal && closeBtn) {
      closeBtn.addEventListener("click", () => modal.style.display = "none");
      window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
    }
  }

 // --- [오버레이] 프로세싱 메시지 순환 --- //
const messages = document.querySelectorAll(".processing-messages p");
let msgIndex = 0;

// 메시지 교체 함수
function rotateProcessingMessages() {
  if (messages.length === 0) return;       // ✅ DOM 없으면 중단
  messages.forEach(m => m.classList.remove("active")); // 모든 메시지 숨김
  messages[msgIndex].classList.add("active");          // 현재 메시지 표시
  msgIndex = (msgIndex + 1) % messages.length;         // 인덱스 증가, 루프
}

// 메시지가 있을 때만 실행
if (messages.length > 0) {
  setInterval(rotateProcessingMessages, 3000);
  rotateProcessingMessages(); // 초기 실행
}

  // --- [오버레이] 20초 타임아웃 처리 --- //
  let overlayTimeout;

  // 오버레이 시작 시 타이머 가동
  function startOverlayTimeout() {
    // 30초 후 실패 처리
    overlayTimeout = setTimeout(() => {
    isTimedOut = true; // ✅ 타임아웃 발생 시 true로 세팅
    clearInterval(msgInterval); // 메시지 순환 중지
      // 파형 숨김
      document.getElementById("waveLoader").style.display = "none";
      document.getElementById("processingMessages").style.display = "none";
      // 실패 메시지 노출
      document.getElementById("errorMessage").style.display = "block";
    }, 30000); // 30초
  }

  // API 완료되면 타임아웃 해제
  function clearOverlayTimeout() {
    clearTimeout(overlayTimeout);
  }

// --- Kakao Map 전용 ---
function loadKakaoMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  const touchadData = JSON.parse(localStorage.getItem("touchadData")) || {};
  const addressBase = touchadData.generalData?.addressBase || localStorage.getItem("address-base") || "";
  const addressDetail = touchadData.generalData?.addressDetail || localStorage.getItem("address-detail") || "";
  const fullAddress = (addressBase + " " + addressDetail).trim();

  const defaultCenter = new kakao.maps.LatLng(37.5665, 126.9780); // 기본 중심: 서울 시청
  const map = new kakao.maps.Map(mapEl, { center: defaultCenter, level: 4 });
  // ✅ 지도 조작 제한 (드래그, 휠 줌 막기)
  map.setDraggable(false);
  map.setZoomable(false);
  const geocoder = new kakao.maps.services.Geocoder();
  const ps = new kakao.maps.services.Places(map);

  // 1️⃣ 주소 → 중심점 이동
  if (fullAddress) {
    geocoder.addressSearch(fullAddress, function(result, status) {
      if (status === kakao.maps.services.Status.OK) {
        const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        map.setCenter(coords);

        // 2️⃣ 반경 2000m 안의 모든 병원 검색 (카테고리 HP8)
        ps.categorySearch("HP8", function(data, status) {
          if (status === kakao.maps.services.Status.OK) {
            const bounds = new kakao.maps.LatLngBounds();

            data.forEach(place => {
              const marker = new kakao.maps.Marker({
                map,
                position: new kakao.maps.LatLng(place.y, place.x)
              });

              const infowindow = new kakao.maps.InfoWindow({
                content: `<div style="padding:4px 6px;">${place.place_name}</div>`
              });

              kakao.maps.event.addListener(marker, "click", () => {
                infowindow.open(map, marker);
              });

              bounds.extend(new kakao.maps.LatLng(place.y, place.x));
            });

            // 3️⃣ 지도 범위를 병원들이 다 보이도록 자동 조정
            map.setBounds(bounds);
          } else {
            console.warn("병원 검색 결과 없음:", status);
          }
        }, { location: coords, radius: 2000 });
      } else {
        console.error("카카오 지오코딩 실패:", status);
      }
    });
  }
}

// ✅ 페이지 로드 후 실행
window.addEventListener("load", loadKakaoMap);


});
