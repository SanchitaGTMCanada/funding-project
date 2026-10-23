"use client";

import { useEffect, useMemo, useState } from "react";

/* =========================================================
   CUSTOMER VISIBLE COLUMNS
   DO NOT ADD INTERNAL DATABASE FIELDS HERE
   ========================================================= */

const CUSTOMER_COLUMNS = [
  "Program Name",
  "Status",
  "Category",
  "Purpose",
  "Eligibility",
  "Eligibility Details",
  "Deadline",
  "Amount Max",
];

/* =========================================================
   COLUMN WIDTHS
   ========================================================= */

const COLUMN_WIDTHS = {
  "Program Name": "240px",
  Status: "150px",
  Category: "180px",
  Purpose: "300px",
  Eligibility: "280px",
  "Eligibility Details": "360px",
  Deadline: "180px",
  "Amount Max": "180px",
};

/* =========================================================
   HELPERS
   ========================================================= */

const normalizeKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const formatValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "-";
    }
  }

  return String(value);
};

const getValue = (service, possibleKeys) => {
  if (!service?.data) return "";

  const data = service.data;

  for (const possibleKey of possibleKeys) {
    if (
      data[possibleKey] !== undefined &&
      data[possibleKey] !== null &&
      String(data[possibleKey]).trim() !== ""
    ) {
      return data[possibleKey];
    }
  }

  const normalizedPossibleKeys =
    possibleKeys.map(normalizeKey);

  const matchingKey = Object.keys(data).find(
    (key) =>
      normalizedPossibleKeys.includes(
        normalizeKey(key)
      )
  );

  if (matchingKey) {
    return data[matchingKey];
  }

  return "";
};

/* =========================================================
   COMPONENT
   ========================================================= */

export default function Home() {
  const [fundingServices, setFundingServices] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] =
    useState(null);

  const [showApplication, setShowApplication] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

    const [isHuman, setIsHuman] = useState(false);

  /* =======================================================
     PAGINATION
     ======================================================= */

  const [currentPage, setCurrentPage] =
    useState(1);

  const [itemsPerPage, setItemsPerPage] =
    useState(10);

  /* =======================================================
     EXPANDED CELLS
     ======================================================= */

  const [expandedCells, setExpandedCells] =
    useState({});

  /* =======================================================
     APPLICATION FORM
     ======================================================= */

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    address: "",
    city: "",
    message: "",
  });

  const [submitting, setSubmitting] =
    useState(false);

  const [applicationMessage, setApplicationMessage] =
    useState("");

  const [applicationError, setApplicationError] =
    useState("");

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  /* =========================================================
     FETCH FUNDING SERVICES
     ========================================================= */

  useEffect(() => {
    const fetchFundingServices = async () => {
      try {
        setLoading(true);

        const response = await fetch(
       "/api/funding-services?public=true",
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to load funding services"
          );
        }

       
const customerVisibleServices = (
  result.fundingServices || []
).filter((service) => {
  const status = String(getValue(service, [
    "Status",
    "status",
    "Program Status",
  ]) || "Open")
    .trim()
    .toLowerCase();

  return status !== "closed";
});

setFundingServices(customerVisibleServices);

      } catch (error) {
        console.error(
          "Funding services error:",
          error
        );

        setFundingServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFundingServices();
  }, []);

  /* =========================================================
     COMMON FIELDS
     ========================================================= */

  const getProgramName = (service) => {
    return (
      getValue(service, [
        "Program Name",
        "program name",
        "Funding Program",
        "Program",
        "Name",
      ]) ||
      service?.title ||
      "Funding Opportunity"
    );
  };

  const getProgramId = (service) => {
    return (
      getValue(service, [
        "Program ID",
        "program id",
        "ProgramID",
        "ID",
      ]) || `FM-${service?.id || ""}`
    );
  };

  const getCategory = (service) => {
    return (
      getValue(service, [
        "Category",
        "category",
        "Funding Category",
      ]) || "Funding"
    );
  };

  const getStatus = (service) => {
    return (
      getValue(service, [
        "Status",
        "status",
        "Program Status",
      ]) || "Open"
    );
  };

  /* =========================================================
     CATEGORIES
     ========================================================= */

  const categories = useMemo(() => {
    const categoryValues = fundingServices
      .map((service) => getCategory(service))
      .filter(Boolean)
      .map((value) => String(value));

    return [
      "All",
      ...new Set(categoryValues),
    ];
  }, [fundingServices]);

  /* =========================================================
     FILTER DATA
     ONLY CUSTOMER-VISIBLE DATA IS SEARCHED
     ========================================================= */

  const filteredServices = useMemo(() => {
    const search = searchTerm
      .toLowerCase()
      .trim();

    return fundingServices.filter((service) => {
      const category = String(
        getCategory(service)
      );

      const matchesCategory =
        selectedCategory === "All" ||
        category.toLowerCase() ===
          selectedCategory.toLowerCase();

      if (!matchesCategory) {
        return false;
      }

      if (!search) {
        return true;
      }

      const searchableData =
        CUSTOMER_COLUMNS.map((column) => {
          if (column === "Program Name") {
            return getProgramName(service);
          }

          return getValue(service, [column]);
        })
          .map(formatValue)
          .join(" ")
          .toLowerCase();

      return searchableData.includes(search);
    });
  }, [
    fundingServices,
    searchTerm,
    selectedCategory,
  ]);

  /* =========================================================
     RESET PAGE WHEN FILTER CHANGES
     ========================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  /* =========================================================
     PAGINATION
     ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredServices.length /
        itemsPerPage
    )
  );

  const paginatedServices = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      itemsPerPage;

    const endIndex =
      startIndex + itemsPerPage;

    return filteredServices.slice(
      startIndex,
      endIndex
    );
  }, [
    filteredServices,
    currentPage,
    itemsPerPage,
  ]);

  /* =========================================================
     PAGE NUMBERS
     ========================================================= */

  const pageNumbers = useMemo(() => {
    const pages = [];

    if (totalPages <= 7) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 4) {
      pages.push("...");
    }

    const start = Math.max(
      2,
      currentPage - 1
    );

    const end = Math.min(
      totalPages - 1,
      currentPage + 1
    );

    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i);
    }

    if (
      currentPage <
      totalPages - 3
    ) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  }, [
    currentPage,
    totalPages,
  ]);

  /* =========================================================
     STATISTICS
     ========================================================= */

  const statistics = useMemo(() => {
    const openCount =
      fundingServices.filter((service) => {
        const status = String(
          getStatus(service)
        ).toLowerCase();

        return (
          status.includes("open") ||
          status.includes("active")
        );
      }).length;

    const categoryCount =
      new Set(
        fundingServices
          .map((service) =>
            getCategory(service)
          )
          .filter(Boolean)
          .map((value) =>
            String(value)
          )
      ).size;

    return {
      total: fundingServices.length,
      open: openCount,
      categories: categoryCount,
      columns: CUSTOMER_COLUMNS.length,
    };
  }, [fundingServices]);

  /* =========================================================
     STATUS STYLE
     ========================================================= */

  const getStatusStyle = (status) => {
    const value = String(
      status || ""
    )
      .toLowerCase()
      .trim();

    if (
      value.includes("closed") ||
      value.includes("expired") ||
      value.includes("rejected")
    ) {
      return {
        background: "#fff1f2",
        color: "#be123c",
        border: "#fecdd3",
        dot: "#e11d48",
      };
    }

    if (
      value.includes("pending") ||
      value.includes("upcoming")
    ) {
      return {
        background: "#fffbeb",
        color: "#b45309",
        border: "#fde68a",
        dot: "#f59e0b",
      };
    }

    return {
      background: "#ecfdf5",
      color: "#047857",
      border: "#a7f3d0",
      dot: "#10b981",
    };
  };

  /* =========================================================
     CELL EXPANSION
     ========================================================= */

  const getCellKey = (
    serviceId,
    column
  ) => {
    return `${serviceId}-${column}`;
  };

  const toggleCell = (
    serviceId,
    column
  ) => {
    const key = getCellKey(
      serviceId,
      column
    );

    setExpandedCells((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  /* =========================================================
     TABLE CELL
     ========================================================= */

  const renderTableValue = (
    service,
    column,
    columnIndex
  ) => {
    let rawValue;

    if (column === "Program Name") {
      rawValue =
        getProgramName(service);
    } else {
      rawValue = getValue(
        service,
        [column]
      );
    }

    const value =
      formatValue(rawValue);

    const cellKey = getCellKey(
      service.id,
      column
    );

    const isExpanded =
      expandedCells[cellKey];

    const isStatusColumn =
      column.toLowerCase() ===
      "status";

    const shouldShowMore =
      value.length > 100;

    const status =
      getStatusStyle(value);

    /* STATUS */

    if (
      isStatusColumn &&
      value !== "-"
    ) {
      return (
        <span
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold"
          style={{
            backgroundColor:
              status.background,
            color: status.color,
            borderColor:
              status.border,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor:
                status.dot,
            }}
          />

          {value}
        </span>
      );
    }

    /* NORMAL SHORT VALUE */

    if (!shouldShowMore) {
      return (
        <span
          className={
            columnIndex === 0
              ? "font-bold text-slate-900"
              : "font-medium text-slate-700"
          }
        >
          {value}
        </span>
      );
    }

    /* LONG VALUE */

    const visibleValue =
      isExpanded
        ? value
        : `${value.slice(
            0,
            100
          )}...`;

    return (
      <div className="max-w-[420px]">
        <span
          className={
            columnIndex === 0
              ? "font-bold text-slate-900"
              : "font-medium text-slate-700"
          }
        >
          {visibleValue}
        </span>

        <button
          type="button"
          onClick={() =>
            toggleCell(
              service.id,
              column
            )
          }
          className="ml-2 whitespace-nowrap text-xs font-bold text-teal-600 underline decoration-teal-200 underline-offset-2 transition hover:text-teal-800"
        >
          {isExpanded
            ? "See Less"
            : "See More"}
        </button>
      </div>
    );
  };

  /* =========================================================
     VIEW MODAL
     ========================================================= */

  const handleView = (service) => {
    setSelectedService(service);
    setShowApplication(false);

    setApplicationMessage("");
    setApplicationError("");

    document.body.style.overflow =
      "hidden";
  };

  /* =========================================================
     APPLY MODAL
     ========================================================= */

  const handleApply = (service) => {
    setSelectedService(service);

    setApplicationMessage("");
    setApplicationError("");
    setIsHuman(false);
    setShowSuccessPopup(false);

    setFormData({
      name: "",
      phone: "",
      email: "",
      company: "",
      address: "",
      city: "",
      message: "",
    });

    setShowApplication(true);

    document.body.style.overflow =
      "hidden";
  };

  /* =========================================================
     CLOSE MODAL
     ========================================================= */

  const closeModal = () => {
    setSelectedService(null);
    setShowApplication(false);

    setApplicationMessage("");
    setApplicationError("");
    setIsHuman(false);

    document.body.style.overflow =
      "";
  };

  /* =========================================================
     FORM INPUT
     ========================================================= */

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     SUBMIT APPLICATION
     ========================================================= */

const handleSubmit = async (event) => {
  event.preventDefault();

  if (!isHuman) {
    setApplicationError("Please confirm that you are human.");
    return;
  }

  if (!selectedService) {
    return;
  }

  setSubmitting(true);
  setApplicationMessage("");
  setApplicationError("");

  try {
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fundingServiceId: selectedService.id,
        ...formData,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setApplicationError(
        result.message || "Failed to submit application."
      );
      return;
    }

    // Show the success popup after successful submission
    setApplicationMessage("");
    setApplicationError("");
    setShowSuccessPopup(true);

    // Reset the form fields
    setFormData({
      name: "",
      phone: "",
      email: "",
      company: "",
      address: "",
      city: "",
      message: "",
    });

  } catch (error) {
    console.error("Application error:", error);

    setApplicationError(
      "Something went wrong. Please try again."
    );
  } finally {
    setSubmitting(false);
  }
};
  /* =========================================================
     SCROLL
     ========================================================= */

  const scrollToOpportunities = () => {
    document
      .getElementById(
        "funding-opportunities"
      )
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f8fb] text-slate-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

<header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#071a2d] shadow-lg">
 <div className="mx-auto flex min-h-[74px] w-full max-w-[1800px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 xl:px-12">
  {/* Logo and Brand */}
  <div className="flex min-w-0 items-center gap-5 sm:gap-6">
    {/* Logo */}
    <a
      href="https://ibsgroupcanada.com/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit IBS Group Canada website"
      className="h-11 w-11 shrink-0 overflow-hidden rounded-xl sm:h-14 sm:w-14"
    >
      <img
        src="/logo.jpg"
        alt="IBS Logo"
        className="h-full w-full object-cover"
      />
    </a>

    {/* Portal Name */}
    <a
      href="/"
      aria-label="Go to Funding Program Portal homepage"
      className="group min-w-0"
    >

      
      <span className="block text-sm font-extrabold leading-tight tracking-[-0.02em] text-white transition-colors duration-300 group-hover:text-[#7DD3FC] sm:text-base md:text-lg">
        IBS Funding Program Portal
      </span>

     
    </a>
  </div>

  {/* Employee Login */}
  <a
    href="/login"
    className="shrink-0 rounded-xl border border-[#7DD3FC]/30 bg-[#2374A8]/20 px-3 py-2.5 text-xs font-bold text-white transition-all duration-300 hover:border-[#7DD3FC]/70 hover:bg-[#2374A8]/40 sm:px-4 sm:text-sm"
  >
    Employee Login
  </a>
</div>
</header>


     
{/* =====================================================
    HERO + FULL-WIDTH STATISTICS
===================================================== */}


<section className="relative isolate overflow-hidden bg-[#061525] text-white">
  {/* Background grid */}
  <div
    className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center"
    style={{
      backgroundImage: "url('/funding-hero.png')",
    }}
    aria-hidden="true"
  />


  {/* Ambient lighting */}
  <div className="pointer-events-none absolute -right-32 -top-40 h-72 w-72 rounded-full bg-teal-400/15 blur-[90px] sm:h-96 sm:w-96" />
  <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-blue-500/10 blur-[90px] sm:h-96 sm:w-96" />

  <div className="relative mx-auto w-full max-w-[1800px] px-4 py-10 sm:px-6 sm:py-14 lg:px-10 lg:py-20 xl:px-14">

    {/* Main responsive layout */}
    <div className="grid min-w-0 grid-cols-1 items-center gap-9 sm:gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.8fr)] lg:gap-10 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.8fr)] xl:gap-16">

      {/* LEFT: HERO CONTENT */}
     
<div className="min-w-0">
  {/* Main heading */}
  <h1 className="max-w-4xl break-words text-[2.45rem] font-black leading-[1.08] tracking-[-0.045em] text-[#0B2438] sm:text-5xl md:text-6xl xl:text-[4.5rem]">
  Find the right 
  <span className="mt-1 block pb-1 text-[#0B2438]">
   funding for your business
  </span>
</h1>
  {/* Description */}
  <p className="mt-5 max-w-2xl text-sm leading-7 text-[#43515C] sm:mt-6 sm:text-base sm:leading-8 lg:text-lg">
    Explore funding programs, grants and financial support
    opportunities from government and partner organizations —
    all in one convenient place.
  </p>

  {/* CTA */}
  <div className="mt-7 flex flex-col items-stretch gap-4 sm:mt-8 sm:flex-row sm:items-center">
    <button
      type="button"
      onClick={scrollToOpportunities}
      className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#2374A8] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#0B2438]/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0B2438] hover:shadow-xl hover:shadow-[#0B2438]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2374A8] focus-visible:ring-offset-2 sm:w-auto"
    >
      Explore Opportunities
      <span
        className="transition-transform duration-300 group-hover:translate-x-1"
        aria-hidden="true"
      >
        →
      </span>
    </button>
  </div>

  {/* Bottom decorative detail */}
  <div className="mt-8 flex items-center gap-3 sm:mt-11">
    <div className="h-1 w-14 rounded-full bg-gradient-to-r from-[#2374A8] to-[#5B9BD5] sm:w-16" />
  </div>
</div>


      {/* RIGHT: STATISTICS PANEL */}
    
{/* Statistics row between hero and funding section */}



    </div>
  </div>
</section>





      {/* =====================================================
          STATS
      ===================================================== */}

<div className="relative z-10 mx-auto -mt-10 w-full max-w-[1250px] px-4 sm:-mt-12 sm:px-6 lg:px-10">
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
    {[
      {
        value: statistics.total,
        label: "Total Opportunities",
        description: "Funding programs to explore",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
            className="h-6 w-6">
            <rect x="5" y="3" width="14" height="18" rx="2.5" />
            <path d="M9 8h6M9 12h6M9 16h3" />
          </svg>
        ),
        color: "text-[#2374A8]",
        iconBg: "bg-[#2374A8]/10",
        accent: "bg-[#2374A8]",
        border: "hover:border-[#2374A8]/40",
        glow: "group-hover:shadow-blue-100",
      },
      {
        value: statistics.open,
        label: "Open Programs",
        description: "Currently accepting applications",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
            className="h-6 w-6">
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16 9" />
          </svg>
        ),
        color: "text-[#0B2438]",
        iconBg: "bg-[#0B2438]/[0.08]",
        accent: "bg-[#0B2438]",
        border: "hover:border-[#0B2438]/30",
        glow: "group-hover:shadow-slate-200",
      },
      {
        value: statistics.categories,
        label: "Funding Categories",
        description: "Support across different needs",
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
            className="h-6 w-6">
            <rect x="3" y="3" width="8" height="8" rx="2" />
            <rect x="13" y="3" width="8" height="8" rx="2" />
            <rect x="3" y="13" width="8" height="8" rx="2" />
            <rect x="13" y="13" width="8" height="8" rx="2" />
          </svg>
        ),
        color: "text-[#5B9BD5]",
        iconBg: "bg-[#5B9BD5]/15",
        accent: "bg-[#5B9BD5]",
        border: "hover:border-[#5B9BD5]/40",
        glow: "group-hover:shadow-sky-100",
      },
].map((stat) => (
  <div
    key={stat.label}
    className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_25px_-12px_rgba(11,36,56,0.20)] sm:p-5 ${stat.border} ${stat.glow}`}
  >
    {/* Brand accent */}
    <div
      className={`absolute inset-x-0 top-0 h-1 ${stat.accent}`}
    />

    {/* Subtle ice-blue glow — static */}
    <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#EEF5F8] opacity-90 blur-2xl" />

    <div className="relative flex items-center gap-3.5">
      {/* Premium icon */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} ${stat.color} ring-1 ring-inset ring-black/[0.03]`}
      >
        {stat.icon}
      </div>

      {/* Statistics */}
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-extrabold leading-tight tracking-tight text-[#0B2438] sm:text-3xl">
          {loading ? (
            <span className="inline-block h-7 w-12 animate-pulse rounded-md bg-[#EEF5F8]" />
          ) : (
            stat.value
          )}
        </p>

        <h3 className="mt-1 text-sm font-bold leading-5 text-[#0B2438]">
          {stat.label}
        </h3>

        <p className="mt-1 text-xs leading-4 text-[#43515C]">
          {stat.description}
        </p>
      </div>
    </div>

    {/* Static bottom accent */}
    <div
      className={`absolute inset-x-4 bottom-0 h-[2px] ${stat.accent} opacity-70`}
    />
  </div>
))}
  </div>
</div>


      {/* =====================================================
          FUNDING OPPORTUNITIES
      ===================================================== */}

      <section
        id="funding-opportunities"
        className="w-full scroll-mt-24 py-5 px-3 sm:px-5 lg:px-8 xl:px-10"
      >

        {/* ===================================================
            SECTION HEADER
        =================================================== */}

        {/* <div className="mx-auto mb-8 w-full max-w-[1900px]">

          <div className="text-xs font-black uppercase tracking-[0.16em] text-teal-600">
            Funding Directory
          </div>

          <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">

            <div>

              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Funding Opportunities
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                Browse available funding opportunities
                and explore the key information you
                need before applying.
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

              <p className="text-xs font-semibold text-slate-400">
                Results
              </p>

              <p className="mt-1 text-2xl font-black text-teal-600">
                {filteredServices.length}
              </p>

            </div>

          </div>

        </div> */}

        {/* ===================================================
            SEARCH
        =================================================== */}

        <div className="mx-auto mb-6 w-full max-w-[1900px]">

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/[0.03]">

            <div className="flex flex-col gap-4 lg:flex-row">

              <div className="relative flex-1">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">
                  ⌕
                </span>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  placeholder="Search funding opportunities..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                />

              </div>

              <div className="relative lg:w-64">

                <select
                  value={
                    selectedCategory
                  }
                  onChange={(event) =>
                    setSelectedCategory(
                      event.target.value
                    )
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white"
                >

                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}

                </select>

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  ▼
                </span>

              </div>

              {(searchTerm ||
                selectedCategory !==
                  "All") && (

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory(
                      "All"
                    );
                  }}
                  className="h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>

              )}

            </div>

          </div>

        </div>

        {/* ===================================================
            TABLE
            MAXIMUM AVAILABLE WIDTH
        =================================================== */}

        {!loading &&
          filteredServices.length >
            0 && (

          <div className="mx-auto w-full max-w-[1900px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/[0.04]">

            {/* TABLE HEADER */}

            <div className="flex flex-col justify-between gap-3 bg-[#071a2d] px-5 py-4 sm:flex-row sm:items-center">

              <div>

                <h3 className="text-sm font-black text-white">
                  Available Funding Programs
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Customer-approved funding information
                </p>

              </div>

              <div className="flex gap-2">

                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                  {CUSTOMER_COLUMNS.length} columns
                </span>

                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  {filteredServices.length} records
                </span>

              </div>

            </div>

            {/* =================================================
                FULL WIDTH TABLE CONTAINER
            ================================================= */}

            <div className="w-full overflow-x-auto">

              <table
                className="w-full min-w-[1900px] border-collapse"
                style={{
                  tableLayout: "auto",
                }}
              >

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50">

                    {/* NUMBER */}

                    <th
                      className="sticky left-0 z-30 whitespace-nowrap border-r border-slate-200 bg-slate-50 px-5 py-4 text-center text-[11px] font-black uppercase tracking-wider text-slate-500"
                      style={{
                        width: "70px",
                        minWidth: "70px",
                      }}
                    >
                      #
                    </th>

                    {/* CUSTOMER COLUMNS */}

                    {CUSTOMER_COLUMNS.map(
                      (column) => (

                        <th
                          key={column}
                          className="whitespace-nowrap border-r border-slate-100 px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-500"
                          style={{
                            width:
                              COLUMN_WIDTHS[
                                column
                              ],
                            minWidth:
                              COLUMN_WIDTHS[
                                column
                              ],
                          }}
                        >
                          {column}
                        </th>

                      )
                    )}

                    {/* ACTIONS */}

                    <th
                      className="sticky right-0 z-30 whitespace-nowrap border-l border-slate-200 bg-slate-50 px-6 py-4 text-center text-[11px] font-black uppercase tracking-wider text-slate-500"
                      style={{
                        width: "190px",
                        minWidth: "190px",
                      }}
                    >
                      Actions
                    </th>

                  </tr>

                </thead>

            <tbody>
  {paginatedServices.map(
    (service, serviceIndex) => {
      const globalIndex =
        (currentPage - 1) *
          itemsPerPage +
        serviceIndex;

      const isEvenRow =
        serviceIndex % 2 === 0;

      return (
        <tr
          key={service.id}
          className={`
            group
            border-b
            border-slate-200
            transition-all
            duration-200
            ${
              isEvenRow
                ? "bg-white hover:bg-teal-50"
                : "bg-[#eaf4f7] hover:bg-teal-100"
            }
          `}
        >
          {/* NUMBER */}

          <td
            className={`
              sticky left-0 z-20
              border-r border-slate-200
              px-5 py-5
              text-center align-top
              ${
                isEvenRow
                  ? "bg-white group-hover:bg-teal-50"
                  : "bg-[#eaf4f7] group-hover:bg-teal-100"
              }
            `}
            style={{
              width: "70px",
              minWidth: "70px",
            }}
          >
            <span
              className="
                inline-flex
                h-8
                min-w-8
                items-center
                justify-center
                rounded-lg
                bg-[#071a2d]
                px-2
                text-xs
                font-black
                text-teal-300
                transition-all
                group-hover:bg-teal-500
                group-hover:text-[#071a2d]
              "
            >
              {globalIndex + 1}
            </span>
          </td>

          {/* CUSTOMER DATA */}

          {CUSTOMER_COLUMNS.map(
            (
              column,
              columnIndex
            ) => (
              <td
                key={`${service.id}-${column}`}
                className="
                  whitespace-normal
                  border-r
                  border-slate-200
                  px-6
                  py-5
                  align-top
                  text-sm
                "
                style={{
                  width:
                    COLUMN_WIDTHS[
                      column
                    ],
                  minWidth:
                    COLUMN_WIDTHS[
                      column
                    ],
                }}
              >
                {renderTableValue(
                  service,
                  column,
                  columnIndex
                )}
              </td>
            )
          )}

          {/* ACTIONS */}

<td
  className="
    sticky right-0 
    border-l border-slate-200
    bg-white
    px-6 py-5
    align-top
  "
  style={{
    width: "190px",
    minWidth: "190px",
    backgroundColor: "#ffffff",
    zIndex: 9999,
  }}
>
  <div className="flex items-center justify-center gap-2">
    <button
      type="button"
      onClick={() => handleView(service)}
      className="
        whitespace-nowrap
        rounded-lg
        border border-slate-300
        bg-white
        px-3.5 py-2
        text-xs font-bold text-slate-700
        shadow-sm transition
        hover:border-teal-400
        hover:bg-teal-50
        hover:text-teal-700
      "
    >
      View
    </button>

    <button
      type="button"
      onClick={() => handleApply(service)}
      className="
        whitespace-nowrap
        rounded-lg
        bg-[#071a2d]
        px-3.5 py-2
        text-xs font-bold text-white
        shadow-sm transition
        hover:bg-teal-600
      "
    >
      Apply
    </button>
  </div>
</td>

        </tr>
      );
    }
  )}
</tbody>

              </table>

            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            <div className="flex flex-col gap-5 border-t border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex flex-wrap items-center gap-3">

                <p className="text-xs font-medium text-slate-500">

                  Showing{" "}

                  <span className="font-bold text-slate-800">
                    {filteredServices.length ===
                    0
                      ? 0
                      : (currentPage -
                          1) *
                          itemsPerPage +
                        1}
                  </span>

                  {" "}to{" "}

                  <span className="font-bold text-slate-800">
                    {Math.min(
                      currentPage *
                        itemsPerPage,
                      filteredServices.length
                    )}
                  </span>

                  {" "}of{" "}

                  <span className="font-bold text-slate-800">
                    {
                      filteredServices.length
                    }
                  </span>

                  {" "}records

                </p>

                <div className="flex items-center gap-2">

                  <span className="text-xs text-slate-400">
                    Rows:
                  </span>

                  <select
                    value={
                      itemsPerPage
                    }
                    onChange={(
                      event
                    ) => {

                      setItemsPerPage(
                        Number(
                          event.target
                            .value
                        )
                      );

                      setCurrentPage(
                        1
                      );

                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-teal-400"
                  >

                    <option value={5}>
                      5
                    </option>

                    <option value={10}>
                      10
                    </option>

                    <option value={20}>
                      20
                    </option>

                    <option value={50}>
                      50
                    </option>

                  </select>

                </div>

              </div>

              {totalPages > 1 && (

                <div className="flex items-center justify-center gap-1.5">

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Prev
                  </button>

                  <div className="flex items-center gap-1">

                    {pageNumbers.map(
                      (
                        page,
                        index
                      ) => {

                        if (
                          page ===
                          "..."
                        ) {

                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-2 text-xs font-bold text-slate-400"
                            >
                              ...
                            </span>
                          );
                        }

                        return (
                          <button
                            type="button"
                            key={page}
                            onClick={() =>
                              setCurrentPage(
                                page
                              )
                            }
                            className={`h-9 min-w-9 rounded-lg px-2.5 text-xs font-black transition ${
                              currentPage ===
                              page
                                ? "bg-[#071a2d] text-white shadow-md"
                                : "border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                            }`}
                          >
                            {page}
                          </button>
                        );

                      }
                    )}

                  </div>

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>

                </div>

              )}

            </div>

          </div>

        )}

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && (

          <div className="mx-auto w-full max-w-[1900px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

            <div className="flex h-14 animate-pulse items-center bg-slate-100 px-5">
              <div className="h-4 w-52 rounded bg-slate-200" />
            </div>

            {[1, 2, 3, 4, 5].map(
              (row) => (

                <div
                  key={row}
                  className="flex h-16 animate-pulse gap-8 border-b border-slate-100 px-5 py-5"
                >

                  <div className="h-4 w-8 rounded bg-slate-100" />

                  <div className="h-4 w-40 rounded bg-slate-100" />

                  <div className="h-4 w-36 rounded bg-slate-100" />

                  <div className="h-4 w-44 rounded bg-slate-100" />

                  <div className="h-4 w-28 rounded bg-slate-100" />

                </div>

              )
            )}

          </div>

        )}

        {/* ===================================================
            EMPTY
        =================================================== */}

        {!loading &&
          filteredServices.length ===
            0 && (

          <div className="mx-auto w-full max-w-[1900px] rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
              ⌕
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-900">
              No funding opportunities
              found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try changing your search
              term or selecting another
              category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory(
                  "All"
                );
              }}
              className="mt-6 rounded-xl bg-[#071a2d] px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-600"
            >
              Clear Filters
            </button>

          </div>

        )}

      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}



      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-[#071a2d]">

     <div className="mx-auto max-w-[1800px] px-5 py-4 text-center sm:px-6 lg:px-10 xl:px-12">
  <div className="pb-3 pt-3 text-xs text-slate-500">
    © Copyright 2026 Innovative Business Solutions | All Rights Reserved
  </div>
</div>

      </footer>

      {/* =====================================================
          VIEW DETAILS MODAL
          ONLY CUSTOMER_COLUMNS ARE SHOWN
      ===================================================== */}

      {selectedService &&
        !showApplication && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020b15]/80 p-4 backdrop-blur-md"
          onClick={closeModal}
        >

          <div
            className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="bg-[#071a2d] px-6 py-6 sm:px-8">

              <div className="flex items-start justify-between gap-5">

                <div className="min-w-0">

                  <div className="mb-3 flex flex-wrap gap-2">

                    <span className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                      {getProgramId(
                        selectedService
                      )}
                    </span>

                    <span className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-slate-300">
                      {getCategory(
                        selectedService
                      )}
                    </span>

                  </div>

                  <h2 className="text-2xl font-black text-white sm:text-3xl">
                    {getProgramName(
                      selectedService
                    )}
                  </h2>

                  <p className="mt-2 text-sm text-slate-300">
                    Key funding opportunity
                    information
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl text-white transition hover:bg-white/20"
                >
                  ×
                </button>

              </div>

            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-8">

              <div className="mb-6 rounded-2xl border border-teal-100 bg-teal-50 p-5">

                <p className="text-xs font-black uppercase tracking-wider text-teal-600">
                  Program
                </p>

                <p className="mt-1 text-lg font-black text-slate-900">
                  {getProgramName(
                    selectedService
                  )}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedService.description ||
                    "Funding opportunity details"}
                </p>

              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">

                <div className="overflow-x-auto">

                  <table className="min-w-full border-collapse">

                    <thead>

                      <tr className="bg-slate-50">

                        <th className="w-16 border-b border-slate-200 px-4 py-4 text-center text-[11px] font-black uppercase tracking-wider text-slate-500">
                          #
                        </th>

                        <th className="w-1/3 whitespace-nowrap border-b border-slate-200 px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
                          Field
                        </th>

                        <th className="border-b border-slate-200 px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-500">
                          Information
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {CUSTOMER_COLUMNS.map(
                        (
                          key,
                          index
                        ) => {

                          const value =
                            key ===
                            "Program Name"
                              ? getProgramName(
                                  selectedService
                                )
                              : getValue(
                                  selectedService,
                                  [key]
                                );

                          const formattedValue =
                            formatValue(
                              value
                            );

                          const isStatus =
                            key.toLowerCase() ===
                            "status";

                          const status =
                            getStatusStyle(
                              formattedValue
                            );

                          return (

                            <tr
                              key={key}
                              className="border-b border-slate-100 last:border-0"
                            >

                              <td className="bg-slate-50/50 px-4 py-4 text-center align-top text-xs font-black text-slate-400">
                                {index +
                                  1}
                              </td>

                              <td className="bg-slate-50/50 px-5 py-4 align-top text-xs font-bold text-slate-600">
                                {key}
                              </td>

                              <td className="break-words px-5 py-4 text-sm leading-6 text-slate-700">

                                {isStatus &&
                                formattedValue !==
                                  "-" ? (

                                  <span
                                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold"
                                    style={{
                                      backgroundColor:
                                        status.background,
                                      color:
                                        status.color,
                                      borderColor:
                                        status.border,
                                    }}
                                  >

                                    <span
                                      className="h-1.5 w-1.5 rounded-full"
                                      style={{
                                        backgroundColor:
                                          status.dot,
                                      }}
                                    />

                                    {
                                      formattedValue
                                    }

                                  </span>

                                ) : (

                                  formattedValue

                                )}

                              </td>

                            </tr>

                          );

                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-8">

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApply(
                    selectedService
                  )
                }
                className="rounded-xl bg-[#071a2d] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-teal-600"
              >
                Apply Now →
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          APPLICATION MODAL
      ===================================================== */}

{/* =====================================================
    APPLICATION MODAL
===================================================== */}

{selectedService && showApplication && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020b15]/80 p-4 backdrop-blur-md"
    onClick={closeModal}
  >
    <div
      className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      {/* HEADER */}
      <div className="bg-[#071a2d] px-6 py-6 sm:px-8">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-teal-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
              Application
            </div>

            <h2 className="text-2xl font-black text-white">
              Apply for Funding
            </h2>

            <p className="mt-1 text-sm text-slate-300">
              {getProgramName(selectedService)}
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            aria-label="Close application form"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl text-white transition hover:bg-white/20 disabled:opacity-50"
          >
            ×
          </button>
        </div>
      </div>

      {/* APPLICATION FORM */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-5 sm:p-8"
      >
        {/* SELECTED PROGRAM */}
        <div className="mb-6 rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-teal-600">
            Applying For
          </p>

          <p className="mt-1 text-sm font-black text-slate-900">
            {getProgramName(selectedService)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Program ID: {getProgramId(selectedService)}
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {applicationError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            {applicationError}
          </div>
        )}

        {/* FORM FIELDS */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* NAME */}
          <div>
            <label
              htmlFor="application-name"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Full Name *
            </label>

            <input
              id="application-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter your full name"
              autoComplete="name"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          {/* PHONE */}
          <div>
            <label
              htmlFor="application-phone"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Phone Number *
            </label>

            <input
              id="application-phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder="Enter phone number"
              autoComplete="tel"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label
              htmlFor="application-email"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Email Address *
            </label>

            <input
              id="application-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter email address"
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          {/* COMPANY */}
          <div>
            <label
              htmlFor="application-company"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Company / Organization
            </label>

            <input
              id="application-company"
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Company or organization"
              autoComplete="organization"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          {/* CITY */}
          <div>
            <label
              htmlFor="application-city"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              City
            </label>

            <input
              id="application-city"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="City"
              autoComplete="address-level2"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          {/* ADDRESS */}
          <div>
            <label
              htmlFor="application-address"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Address
            </label>

            <input
              id="application-address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Address"
              autoComplete="street-address"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />
          </div>

          {/* MESSAGE */}
          <div className="sm:col-span-2">
            <label
              htmlFor="application-message"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Message / Reason for Applying
            </label>

            <textarea
              id="application-message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={5}
              placeholder="Tell us about your funding requirement..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />
          </div>
        </div>

        {/* I'M HUMAN CHECKBOX */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isHuman}
              onChange={(event) => {
                setIsHuman(event.target.checked);

                if (event.target.checked) {
                  setApplicationError("");
                }
              }}
              className="h-5 w-5 shrink-0 cursor-pointer accent-teal-600"
            />

            <span className="text-sm font-semibold text-slate-700">
              I'm not a robot
            </span>
          </label>
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || !isHuman}
            className="rounded-xl bg-[#071a2d] px-7 py-3 text-sm font-black text-white shadow-lg transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : "Submit Application →"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}


      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#020b15]/75 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="success-popup-title"
            aria-describedby="success-popup-description"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[#D6E3ED] bg-white shadow-2xl"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0B2438] via-[#2374A8] to-[#7DD3FC]" />

            <div className="px-6 py-9 text-center sm:px-9">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-emerald-600"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>

              <h2
                id="success-popup-title"
                className="mt-6 text-2xl font-extrabold tracking-tight text-[#0B2438] sm:text-3xl"
              >
                Thank you for reaching out!
              </h2>

              <p
                id="success-popup-description"
                className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#43515C] sm:text-base"
              >
                Your form has been submitted successfully. We’ve received your
                message, and our team will get back to you soon.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessPopup(false);
                  closeModal();
                }}
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0B2438] px-6 py-3 text-sm font-bold text-white transition duration-300 hover:bg-[#2374A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2374A8] focus-visible:ring-offset-2"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}