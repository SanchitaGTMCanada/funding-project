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

        setFundingServices(
          result.fundingServices || []
        );
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

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedService) {
      return;
    }

    setSubmitting(true);
    setApplicationMessage("");
    setApplicationError("");

    try {
      const response = await fetch(
        "/api/applications",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            fundingServiceId:
              selectedService.id,
            ...formData,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        setApplicationError(
          result.message ||
            "Failed to submit application."
        );

        return;
      }

      setApplicationMessage(
        "Application submitted successfully!"
      );

      setFormData({
        name: "",
        phone: "",
        email: "",
        company: "",
        address: "",
        city: "",
        message: "",
      });

      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (error) {
      console.error(
        "Application error:",
        error
      );

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

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071a2d]/95 shadow-lg backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1800px] items-center justify-between px-5 sm:px-6 lg:px-10 xl:px-12">

          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg">
              <img src={"\logo.jpg"}></img>
            </div>

            <div className="text-left">
              <div className="text-base font-black text-white sm:text-lg">
                Funding Management
              </div>

              <div className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-teal-300 sm:block">
                Funding Opportunities Portal
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-2 md:flex">

            <button
              type="button"
              onClick={
                scrollToOpportunities
              }
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              Opportunities
            </button>

            <a
              href="#how-it-works"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              How It Works
            </a>

            <a
              href="/login"
              className="ml-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Employee Login
            </a>

          </nav>
        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#071a2d]">

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
            backgroundSize:
              "42px 42px",
          }}
        />

        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-teal-500/20 blur-3xl" />

        <div className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-[1800px] px-5 py-20 sm:px-6 lg:px-10 lg:py-24 xl:px-12">

          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">

            {/* =================================================
                IBS LOGO
            ================================================= */}

            <div className="flex shrink-0 items-center justify-center lg:w-[320px] xl:w-[360px]">

              <div className="relative flex items-center justify-center">

                <div className="absolute h-64 w-64 rounded-full bg-teal-400/8 blur-3xl" />

                <div
                  className="
                    relative
                    h-[285px] w-[285px]
                    rounded-full
                    bg-gradient-to-br
                    from-teal-300/80
                    via-cyan-400/60
                    to-blue-500/70
                    p-[2px]
                    shadow-[0_8px_30px_rgba(0,0,0,0.28)]
                    sm:h-[315px] sm:w-[315px]
                    lg:h-[345px] lg:w-[345px]
                  "
                >

                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#071a2d] p-2">

                    <div
                      className="
                        flex h-full w-full items-center justify-center
                        rounded-full
                        border border-white/10
                        bg-[#0a2238]
                        p-2
                      "
                    >

                      <div
                        className="
                          relative
                          h-full w-full
                          overflow-hidden
                          rounded-full
                          border
                          border-teal-300/30
                          bg-white
                          shadow-[0_8px_25px_rgba(0,0,0,0.32)]
                        "
                      >

                        <img
                          src="/logo.jpg"
                          alt="IBS Group Canada"
                          className="h-full w-full object-cover"
                        />

                        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent" />

                      </div>

                    </div>

                  </div>

                </div>

                <div className="absolute -right-1 top-10 h-2.5 w-2.5 rounded-full bg-teal-300/70" />

                <div className="absolute bottom-1 left-10 h-2 w-2 rounded-full bg-cyan-300/60" />

              </div>

            </div>

            {/* =================================================
                HERO CONTENT
            ================================================= */}

            <div className="max-w-5xl flex-1">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-teal-200">

                <span className="h-2 w-2 rounded-full bg-teal-400" />

                Funding Opportunities

              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">

                Find funding

                <span className="block bg-gradient-to-r from-teal-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                  opportunities that fit.
                </span>

              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">

                Explore funding programs, grants and
                financial support opportunities from
                government and partner organizations —
                all in one convenient place.

              </p>

              <button
                type="button"
                onClick={
                  scrollToOpportunities
                }
                className="mt-8 rounded-xl bg-teal-400 px-6 py-3.5 text-sm font-black text-[#071a2d] shadow-xl transition hover:-translate-y-0.5 hover:bg-teal-300"
              >
                Explore Opportunities →
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          STATS
      ===================================================== */}
<section className="relative z-10 -mt-8 px-5 sm:px-6 lg:px-10 xl:px-12">

  <div className="mx-auto grid max-w-[1800px] gap-4 sm:grid-cols-2 lg:grid-cols-3">

    {[
      {
        value: statistics.total,
        label: "Total Opportunities",
        description: "Available funding programs",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M8 8h8" />
            <path d="M8 12h8" />
            <path d="M8 16h5" />
          </svg>
        ),
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        accent: "from-indigo-500 to-violet-500",
      },

      {
        value: statistics.open,
        label: "Open Programs",
        description: "Currently accepting applications",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 2.5 2.5L16 9" />
          </svg>
        ),
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        accent: "from-emerald-500 to-teal-500",
      },

      {
        value: statistics.categories,
        label: "Funding Categories",
        description: "Distinct funding classifications",
        icon: (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 5h16" />
            <path d="M4 12h16" />
            <path d="M4 19h16" />
            <circle cx="8" cy="5" r="1" />
            <circle cx="16" cy="12" r="1" />
            <circle cx="10" cy="19" r="1" />
          </svg>
        ),
        iconBg: "bg-cyan-100",
        iconColor: "text-cyan-600",
        accent: "from-cyan-500 to-blue-500",
      },
    ].map((stat) => (

      <div
        key={stat.label}
        className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-100 via-slate-50 to-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_25px_rgba(15,23,42,0.08)]"
      >

        {/* Subtle gradient accent */}
        <div
          className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${stat.accent}`}
        />

        {/* Very subtle background glow */}
        <div
          className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${stat.accent} opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.12]`}
        />

        <div className="relative flex items-center gap-4">

          {/* Icon */}
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor} border border-white shadow-sm transition-transform duration-300 group-hover:scale-105`}
          >
            {stat.icon}
          </div>

          {/* Main information */}
          <div className="min-w-0">

            <div className="flex items-center gap-3">

              <p className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                {loading ? "—" : stat.value}
              </p>

            </div>

            <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
              {stat.label}
            </p>

            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
              {stat.description}
            </p>

          </div>

        </div>

        {/* Bottom progress accent */}
        <div className="relative mt-4 h-[2px] overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full w-1/3 rounded-full bg-gradient-to-r ${stat.accent} transition-all duration-500 group-hover:w-2/3`}
          />
        </div>

      </div>

    ))}

  </div>

</section>

      {/* =====================================================
          FUNDING OPPORTUNITIES
      ===================================================== */}

      <section
        id="funding-opportunities"
        className="w-full scroll-mt-24 px-3 py-20 sm:px-5 lg:px-8 xl:px-10"
      >

        {/* ===================================================
            SECTION HEADER
        =================================================== */}

        <div className="mx-auto mb-8 w-full max-w-[1900px]">

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

        </div>

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
            className={`
              sticky right-0 z-20
              border-l border-slate-200
              px-6 py-5
              align-top
              ${
                isEvenRow
                  ? "bg-white group-hover:bg-teal-50"
                  : "bg-[#eaf4f7] group-hover:bg-teal-100"
              }
            `}
            style={{
              width: "190px",
              minWidth: "190px",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleView(
                    service
                  )
                }
                className="
                  whitespace-nowrap
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-3.5
                  py-2
                  text-xs
                  font-bold
                  text-slate-700
                  shadow-sm
                  transition
                  hover:border-teal-400
                  hover:bg-teal-50
                  hover:text-teal-700
                "
              >
                View
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApply(
                    service
                  )
                }
                className="
                  whitespace-nowrap
                  rounded-lg
                  bg-[#071a2d]
                  px-3.5
                  py-2
                  text-xs
                  font-bold
                  text-white
                  shadow-sm
                  transition
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

      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-white"
      >

        <div className="mx-auto max-w-[1800px] px-5 py-20 sm:px-6 lg:px-10 xl:px-12">

          <div className="mx-auto max-w-2xl text-center">

            <div className="text-xs font-black uppercase tracking-[0.16em] text-teal-600">
              Simple Process
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Find. Review. Apply.
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">
              Discover funding opportunities,
              review their details and submit
              your application.
            </p>

          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">

            {[
              {
                number: "01",
                title: "Explore",
                text: "Browse available funding opportunities and search across the customer-visible funding information.",
              },
              {
                number: "02",
                title: "Review",
                text: "Open an opportunity to review its approved program information before applying.",
              },
              {
                number: "03",
                title: "Apply",
                text: "Submit your details through the application form and our team will receive your request.",
              },
            ].map((step) => (

              <div
                key={
                  step.number
                }
                className="rounded-3xl border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#071a2d] text-sm font-black text-teal-300">
                    {step.number}
                  </div>

                  <span className="text-4xl font-black text-slate-200">
                    {step.number}
                  </span>

                </div>

                <h3 className="mt-7 text-xl font-black text-slate-900">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {step.text}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-[#071a2d]">

        <div className="mx-auto max-w-[1800px] px-5 py-12 sm:px-6 lg:px-10 xl:px-12">

          <div className="flex flex-col justify-between gap-8 md:flex-row">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400 text-lg font-black text-[#071a2d]">
                  <img src={"\logo.jpg"}></img>
                </div>

                <div>

                  <p className="font-black text-white">
                    Funding Management
                  </p>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                    Funding Opportunities
                    Portal
                  </p>

                </div>

              </div>

              <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
                A centralized platform for
                discovering and applying for
                funding opportunities.
              </p>

            </div>

            <div className="flex flex-col gap-3 text-sm">

              <button
                type="button"
                onClick={
                  scrollToOpportunities
                }
                className="text-left font-semibold text-slate-400 transition hover:text-teal-300"
              >
                Funding Opportunities
              </button>

              <a
                href="#how-it-works"
                className="font-semibold text-slate-400 transition hover:text-teal-300"
              >
                How It Works
              </a>

              <a
                href="/login"
                className="font-semibold text-slate-400 transition hover:text-teal-300"
              >
                Employee Login
              </a>

            </div>

          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-xs text-slate-500">
            ©{" "}
            {new Date().getFullYear()}{" "}
            Funding Management.
            All rights reserved.
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

      {selectedService &&
        showApplication && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020b15]/80 p-4 backdrop-blur-md"
          onClick={closeModal}
        >

          <div
            className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

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
                    {getProgramName(
                      selectedService
                    )}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    submitting
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  ×
                </button>

              </div>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="flex-1 overflow-y-auto p-5 sm:p-8"
            >

              <div className="mb-6 rounded-2xl border border-teal-100 bg-teal-50 p-4">

                <p className="text-[10px] font-black uppercase tracking-wider text-teal-600">
                  Applying For
                </p>

                <p className="mt-1 text-sm font-black text-slate-900">
                  {getProgramName(
                    selectedService
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Program ID:{" "}
                  {getProgramId(
                    selectedService
                  )}
                </p>

              </div>

              {applicationMessage && (

                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {applicationMessage}
                </div>

              )}

              {applicationError && (

                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {applicationError}
                </div>

              )}

              <div className="grid gap-5 sm:grid-cols-2">

                {/* NAME */}

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    placeholder="Enter your full name"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />

                </div>

                {/* PHONE */}

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Phone Number *
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    placeholder="Enter phone number"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />

                </div>

                {/* EMAIL */}

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Email Address *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                    placeholder="Enter email address"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />

                </div>

                {/* COMPANY */}

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Company / Organization
                  </label>

                  <input
                    type="text"
                    name="company"
                    value={
                      formData.company
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Company or organization"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />

                </div>

                {/* CITY */}

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={
                      formData.city
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="City"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />

                </div>

                {/* ADDRESS */}

                <div>

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Address
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={
                      formData.address
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Address"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />

                </div>

                {/* MESSAGE */}

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Message / Reason for Applying
                  </label>

                  <textarea
                    name="message"
                    value={
                      formData.message
                    }
                    onChange={
                      handleInputChange
                    }
                    rows={5}
                    placeholder="Tell us about your funding requirement..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />

                </div>

              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    submitting
                  }
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="rounded-xl bg-[#071a2d] px-7 py-3 text-sm font-black text-white shadow-lg transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
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

    </main>
  );
}