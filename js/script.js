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
          },
          resData: apiData,
        };
        localStorage.setItem("touchadData", JSON.stringify(localData));
        window.location.href = "r.html"; // ✅ rr.html → r.html
      } catch (err) {
        resultEl.innerHTML = `<p style="color:red;">에러 발생: ${err.message}</p>`;
      } finally {
        overlay.style.display = "none";
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

          clearOverlayTimeout();     // ❌ 실패 시에도 타이머 해제
          if (loadingOverlay) loadingOverlay.style.display = "none";
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

  // ✅ Google Sheet에는 API value 값 저장 (card_sub와 동일)
  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nameInput.value,
      phone: phoneInput.value,
      email: emailInput.value,
      "hospital-name": hospitalNameInput.value,
      specialty: specialtyOption.getAttribute("name"),  //
      "address-base": addressBaseInput.value,
      "address-detail": addressDetailInput.value,
      gender: genderSelect.value,                    // 성별은 코드값(M/F)
      age: ageOption.getAttribute("name"),
      "privacy-consent": privacyConsentCheckbox.checked,
    }),
  });

  const result = await response.json();
  if (result.uuid) {
    // ✅ 시트 저장 후 필요한 식별값만 로컬스토리지에 남김
    localStorage.setItem("user_uuid", result.uuid);
    localStorage.setItem("user_uid", result.uid);

    // 📌 localStorage에 touchadData는 여기서 덮어쓰지 않음!
    // 화면 출력용 데이터는 fetchData()에서만 저장하도록 역할 분리

    // 이후 결과 페이지로 이동은 fetchData()가 처리
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

    // 비율 계산
    const agePercent = Math.round((resData[1].target / resData[0].target) * 100, 1);
    const genderPercent = Math.round((resData[2].target / resData[0].target) * 100, 1);

    const span = document.createElement("span");
    span.className = "line";
    span.innerHTML = `지난 4주간, ${hospitalName} <span class="uspH">반경 700m</span> 내에서 <span class="uspH">${resData[0].target.toLocaleString()}</span>건의 <span class="uspH">${generalData.partnerCd} 관련 소비</span>가 있었습니다. 이 중 <span class="uspH">${generalData.age}는 ${isNaN(agePercent) ? 0 : agePercent}%, ${generalData.gender}은 ${isNaN(genderPercent) ? 0 : genderPercent}%</span>입니다.`;
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

    // CTA 버튼 (기본 alert 제거 → Sheet 업데이트로 대체됨)
    document.querySelector(".cta__button")?.addEventListener("click", () => {
      console.log("CTA 버튼 클릭됨");
    });

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
      const currentSrcElement = video.querySelector("source");
      const currentSrc = currentSrcElement ? currentSrcElement.getAttribute("src") : "";
      if (newSrc && newSrc !== currentSrc) {
        video.innerHTML = "";
        const sourceElement = document.createElement("source");
        sourceElement.setAttribute("src", newSrc);
        sourceElement.setAttribute("type", "video/mp4");
        video.appendChild(sourceElement);
        video.load();
      }
    }
    loadResponsiveVideo();
    window.addEventListener("resize", loadResponsiveVideo);

    const videoWrapper = document.querySelector(".intro__video-wrapper");
    if (videoWrapper) {
      const triggerElement = document.querySelector(".animate-lines .line:nth-child(3)");
      triggerElement?.addEventListener("animationend", () => {
        videoWrapper.classList.add("visible");
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
// --- [오버레이] 20초 타임아웃 처리 --- //
let overlayTimeout;

// 오버레이 시작 시 타이머 가동
function startOverlayTimeout() {
  // 20초 후 실패 처리
  overlayTimeout = setTimeout(() => {
    // 파형 숨김
    document.getElementById("waveLoader").style.display = "none";
    document.getElementById("processingMessages").style.display = "none";
    // 실패 메시지 노출
    document.getElementById("errorMessage").style.display = "block";
  }, 20000); // 20초
}

// API 완료되면 타임아웃 해제
function clearOverlayTimeout() {
  clearTimeout(overlayTimeout);
}



});
