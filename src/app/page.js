"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
   FILTER OPTIONS
   ========================================================= */

const APPLICANT_TYPES = [
  "First Nation / Indigenous government or band, including tribal councils",
  "Inuit organization (NTI, Regional Inuit Associations, development corporations)",
  "Métis organization or council",
  "Community or municipal government (cities, towns, villages, hamlets, charter communities)",
  "Indigenous-owned business",
  "Small business / entrepreneur",
  "Non-profit / society / charity, including co-operatives",
  "Housing provider or developer",
  "School, college or post-secondary institution",
  "Individual / youth / student / senior",
  "Other",
  "Not sure",
];

const TERRITORIES = [
  "Canada-wide",
  "Northwest Territories",
  "Nunavut",
  "Yukon",
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Other",
];

/* Community options are curated only for NWT and Nunavut for now.
   Other provinces and territories use a free-text community field. */
const TERRITORY_COMMUNITIES = {
  "Northwest Territories": [
    "Aklavik", "Fort McPherson", "Inuvik", "Paulatuk", "Sachs Harbour",
    "Tsiigehtchic", "Tuktoyaktuk", "Ulukhaktok", "Colville Lake", "Délı̨nę",
    "Fort Good Hope", "Norman Wells", "Tulita", "Fort Liard", "Fort Simpson",
    "Jean Marie River", "Nahanni Butte", "Sambaa K'e", "Wrigley", "Behchokǫ̀",
    "Dettah", "Gamètì", "Łutselk'e", "Wekweètì", "Whatì", "Yellowknife",
    "Enterprise", "Fort Providence", "Fort Resolution", "Fort Smith", "Hay River",
    "Kakisa", "Kátł'odeeche", "Other",
  ],
  Nunavut: [
    "Iqaluit", "Arctic Bay", "Clyde River", "Grise Fiord", "Igloolik",
    "Kimmirut", "Kinngait", "Pangnirtung", "Pond Inlet", "Qikiqtarjuaq",
    "Resolute Bay", "Sanikiluaq", "Sanirajak", "Arviat", "Baker Lake",
    "Chesterfield Inlet", "Coral Harbour", "Naujaat", "Rankin Inlet", "Whale Cove",
    "Cambridge Bay", "Gjoa Haven", "Kugaaruk", "Kugluktuk", "Taloyoak", "Other",
  ],
};

const CATEGORY_TREE = [
  { name: "Business Development", children: [] },
  { name: "Community Development", children: [] },
  { name: "Capacity Building", children: [] },
  { name: "Education & Training", children: [] },
  {
    name: "Financial & Income Assistance",
    children: ["Financial Assistance", "Income Assistance"],
  },
  { name: "Environment & Energy", children: [] },
  { name: "Housing", children: [] },
  { name: "Arts & Culture", children: [] },
  {
    name: "Infrastructure & Transportation",
    children: ["Infrastructure", "Transportation"],
  },
  { name: "Health & Wellness", children: [] },
  { name: "Research & Innovation", children: [] },
  { name: "Agriculture & Food", children: [] },
  { name: "Jobs & Employment", children: [] },
  {
    name: "Gender Equity, Justice & Victim Support",
    children: ["Gender & Equity", "Justice & Victim Support"],
  },
  {
    name: "Land, Natural Resources & Harvesting",
    children: ["Natural Resources", "Hunting & Trapping"],
  },
  { name: "Emergencies & Public Safety", children: [] },
  { name: "Early Learning & Childcare", children: [] },
  { name: "Sports & Recreation", children: [] },
  { name: "Other", children: [] },
];

const TOP_LEVEL_CATEGORIES = CATEGORY_TREE.map(
  (category) => category.name
);

/* =========================================================
   FILTER HELPERS
   ========================================================= */

const splitTags = (value) => {
  if (Array.isArray(value)) return value.flatMap(splitTags);

  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (typeof value === "object") {
    return Object.values(value).flatMap(splitTags);
  }

  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const valuesMatch = (left, right) =>
  String(left ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") ===
  String(right ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/* =========================================================
   GENERAL HELPERS
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

// Format numeric amounts with Canadian/Western digit grouping (1,000,000),
// while preserving currency symbols, labels, ranges, and other surrounding text.
const formatCanadianAmount = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-CA", {
      useGrouping: true,
      maximumFractionDigits: 20,
    }).format(value);
  }

  if (typeof value !== "string") {
    return formatValue(value);
  }

  return value.replace(/\d[\d,]*(?:\.\d+)?/g, (numberText) => {
    const numericValue = Number(numberText.replace(/,/g, ""));

    if (!Number.isFinite(numericValue)) {
      return numberText;
    }

    return new Intl.NumberFormat("en-CA", {
      useGrouping: true,
      maximumFractionDigits: 20,
    }).format(numericValue);
  });
};

const isAmountField = (key) =>
  /amount|funding amount|maximum amount|minimum amount|max amount|min amount/i.test(
    String(key || "")
  );

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

  const matchingKey = Object.keys(data).find((key) =>
    normalizedPossibleKeys.includes(normalizeKey(key))
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
  const [fundingServices, setFundingServices] = useState([]);

  const featuredCarouselRef = useRef(null);

  const moveFeaturedCarousel = (direction) => {
    const carousel = featuredCarouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction * carousel.clientWidth * 0.85,
      behavior: "smooth",
    });
  };

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Refresh deadline checks periodically so expired featured programs
  // disappear without requiring a manual page refresh.
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const [selectedService, setSelectedService] = useState(null);

  const [showApplication, setShowApplication] = useState(false);

  /* FILTER STATE */
  const [selectedApplicantTypes, setSelectedApplicantTypes] =
    useState([]);

  const [selectedTerritory, setSelectedTerritory] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("");

  const [selectedCategories, setSelectedCategories] = useState([]);

  const [isHuman, setIsHuman] = useState(false);

  /* TABLE SEARCH + PAGINATION */
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* EXPANDED CELLS */
  const [expandedCells, setExpandedCells] = useState({});

  /* APPLICATION FORM */
  // Keep legacy address/city keys for compatibility with the existing API.
  const initialFormData = {
    name: "",
    company: "",
    whoYouAre: "",
    province: "",
    community: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    message: "",
    consent: false,
  };

  const [formData, setFormData] = useState({ ...initialFormData });
  const [submitting, setSubmitting] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationError, setApplicationError] = useState("");
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


        // alert("called");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to load funding services"
          );
        }

        const customerVisibleServices = (
          result.fundingServices || []
        ).filter((service) => {
          const status = String(
            getValue(service, [
              "Status",
              "status",
              "Program Status",
            ]) || "Open"
          )
            .trim()
            .toLowerCase();

          return status !== "closed";
        });

        setFundingServices(customerVisibleServices);
      } catch (error) {
        console.error("Funding services error:", error);
        setFundingServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFundingServices();
  }, []);

  /* =========================================================
     FEATURED PROGRAMS
     Only staff-selected programs with customer-visible statuses
     and a future deadline appear in the featured carousel.
     ========================================================= */

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
    // Do not default missing status values to "Open". Programs without a
    // configured status must remain hidden from the customer-facing table.
    return getValue(service, [
      "Status",
      "status",
      "Program Status",
    ]) ?? "";
  };

  const CUSTOMER_VISIBLE_STATUSES = new Set([
    "open",
    "open (rolling)",
    "upcoming",
    "no application required",
  ]);

  const isCustomerVisibleProgram = (service) => {
    const normalizedStatus = String(getStatus(service) ?? "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");

    return CUSTOMER_VISIBLE_STATUSES.has(normalizedStatus);
  };

  // A featured program must have a real, future deadline.
  // Date-only values remain valid through the end of that calendar day.
  const getProgramDeadlineDate = (service) => {
    const rawDeadline = getValue(service, [
      "Deadline",
      "Application Deadline",
      "Closing Date",
      "End Date",
    ]);

    if (
      rawDeadline === null ||
      rawDeadline === undefined ||
      String(rawDeadline).trim() === ""
    ) {
      return null;
    }

    if (rawDeadline instanceof Date) {
      return Number.isNaN(rawDeadline.getTime())
        ? null
        : rawDeadline;
    }

    const deadlineText = String(rawDeadline).trim();
    const dateOnlyMatch = deadlineText.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        23,
        59,
        59,
        999
      );

      return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsedDate = new Date(deadlineText);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const featuredPrograms = useMemo(() => {
    return fundingServices.filter((service) => {
      const featuredValue =
        service?.isFeatured ?? service?.data?.isFeatured;

      // Accept boolean, numeric, and string representations returned by the API.
      // Staff selection is the only featured-carousel requirement: deadline and
      // status may be missing, expired, or not yet configured.
      return (
        featuredValue === true ||
        featuredValue === 1 ||
        String(featuredValue ?? "").trim().toLowerCase() === "true"
      );
    });
  }, [fundingServices]);

  /* =========================================================
     FILTER DATA
     ========================================================= */

  const getApplicantTypes = (service) => {
    const raw = getValue(service, [
      "Who you are",
      "Who You Are",
      "Applicant Type",
      "Applicant Types",
      "Eligible Applicant",
      "Eligible Applicants",
      "Applicant",
      "Who Can Apply",
    ]);

    if (typeof raw === "string") {
      const normalizedRaw = raw.toLowerCase();

      const exactKnownOptions = APPLICANT_TYPES.filter(
        (option) =>
          option !== "Not sure" &&
          normalizedRaw.includes(option.toLowerCase())
      );

      if (exactKnownOptions.length) {
        return exactKnownOptions;
      }
    }

    return splitTags(raw);
  };

  const getTerritories = (service) =>
    splitTags(
      getValue(service, [
        "Territory/Province",
        "Territory / Province",
        "Territory",
        "Province",
        "Location",
        "Geographic Eligibility",
        "Eligible Provinces",
        "Eligible Territory",
      ])
    );

  const getCommunityTags = (service) =>
    splitTags(
      getValue(service, [
        "Communities",
        "Community",
        "Eligible Communities",
        "Community Tags",
      ])
    );

  const getCategoryTags = (service) =>
    splitTags(
      getValue(service, [
        "Category",
        "category",
        "Funding Category",
        "Categories",
      ])
    );

  /* Use the fixed category structure so all specified options are
     available even when no current program uses a category yet. */
  const categoryTree = CATEGORY_TREE;

  const hasActiveApplicantFilter =
    selectedApplicantTypes.length > 0 &&
    !selectedApplicantTypes.includes("Not sure");

 

const filteredServices = useMemo(() => {
  return fundingServices.filter((service) => {
    // Only approved statuses are visible to customers. This happens before
    // category/applicant/location filters, search, and pagination.
    if (!isCustomerVisibleProgram(service)) return false;

    const applicantTypes = getApplicantTypes(service);
    const territoryTags = getTerritories(service);
    const communityTags = getCommunityTags(service);
    const categoryTags = getCategoryTags(service);

    /* Who you are: match any selected applicant type. */
    const matchesApplicant =
      !hasActiveApplicantFilter ||
      applicantTypes.some((tag) =>
        selectedApplicantTypes.some((selected) =>
          valuesMatch(tag, selected)
        )
      );

    if (!matchesApplicant) return false;

    /* Territory: include Canada-wide programs
       when a specific province or territory is selected. */
    const isCanadaWide = territoryTags.some((tag) =>
      [
        "Canada-wide",
        "Canada wide",
        "National",
        "All Canada",
        "All Provinces & Territories",
      ].some((national) => valuesMatch(tag, national))
    );

    /* This special location excludes Nunavut, so it applies to every
       selected province/territory except Nunavut, but is not Canada-wide. */
    const availableExceptNunavut = territoryTags.some((tag) =>
      valuesMatch(tag, "All Provinces & Territories except Nunavut")
    );

    const isNunavutSelected = valuesMatch(selectedTerritory, "Nunavut");

    const matchesTerritory =
      !selectedTerritory ||
      (valuesMatch(selectedTerritory, "Canada-wide")
        ? isCanadaWide
        : isCanadaWide ||
          (!isNunavutSelected && availableExceptNunavut) ||
          territoryTags.some((tag) =>
            valuesMatch(tag, selectedTerritory)
          ));

    if (!matchesTerritory) return false;

    /* Community: include community-specific programs and programs that
       apply broadly across the selected territory or Canada-wide.
       An empty Communities field means the program is not community-restricted. */
    const matchesCommunity =
      !selectedCommunity ||
      communityTags.length === 0 ||
      communityTags.some((tag) => valuesMatch(tag, selectedCommunity));

    if (!matchesCommunity) return false;

    /* Category: decode parent-specific subcategory keys.
       Example: "Infrastructure & Transportation::Highways"
       matches the tag "Highways", not another parent's
       subcategory with the same label. */
    const selectedCategoryLabels = selectedCategories.map(
      (selected) => {
        const separatorIndex = selected.indexOf("::");

        if (separatorIndex === -1) {
          // A top-level category was selected.
          return selected;
        }

        // A parent-specific subcategory was selected.
        return selected.slice(separatorIndex + 2);
      }
    );

    const matchesCategory =
      selectedCategories.length === 0 ||
      categoryTags.some((tag) =>
        selectedCategoryLabels.some((selected) =>
          valuesMatch(tag, selected)
        )
      );

    return matchesCategory;
  });
}, [
  fundingServices,
  selectedApplicantTypes,
  selectedTerritory,
  selectedCommunity,
  selectedCategories,
  hasActiveApplicantFilter,
  isCustomerVisibleProgram,
]);



  const toggleApplicantType = (type) => {
    if (type === "Not sure") {
      setSelectedApplicantTypes([]);
      return;
    }

    setSelectedApplicantTypes((previous) =>
      previous.includes(type)
        ? previous.filter((item) => item !== type)
        : [
            ...previous.filter((item) => item !== "Not sure"),
            type,
          ]
    );
  };

const toggleCategory = (categoryKey) => {
  setSelectedCategories((previous) =>
    previous.includes(categoryKey)
      ? previous.filter((item) => item !== categoryKey)
      : [...previous, categoryKey]
  );
};

  const clearFilters = () => {
    setSelectedApplicantTypes([]);
    setSelectedTerritory("");
    setSelectedCommunity("");
    setSelectedCategories([]);
    setTableSearch("");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedApplicantTypes,
    selectedTerritory,
    selectedCommunity,
    selectedCategories,
  ]);

  /* =========================================================
     TABLE SEARCH
     Search program names, descriptions, and all customer-facing
     program data. Search runs after the selected filters and before
     pagination, so page counts stay accurate.
     ========================================================= */

  const searchedServices = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();

    if (!query) return filteredServices;

    return filteredServices.filter((service) => {
      const searchableValues = [
        service?.title,
        service?.description,
        getProgramName(service),
        ...Object.values(service?.data || {}),
      ];

      return searchableValues.some((value) => {
        let searchableText;

        if (value && typeof value === "object") {
          try {
            searchableText = JSON.stringify(value);
          } catch {
            searchableText = "";
          }
        } else {
          searchableText = String(value ?? "");
        }

        return searchableText.toLowerCase().includes(query);
      });
    });
  }, [filteredServices, tableSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch]);

  /* =========================================================
     PAGINATION
     ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(searchedServices.length / itemsPerPage)
  );

  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return searchedServices.slice(startIndex, endIndex);
  }, [searchedServices, currentPage, itemsPerPage]);

  /* =========================================================
     PAGE NUMBERS
     ========================================================= */

  const pageNumbers = useMemo(() => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 4) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 3) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  }, [currentPage, totalPages]);

  /* =========================================================
     STATISTICS
     ========================================================= */

  const statistics = useMemo(() => {
    const openCount = fundingServices.filter((service) => {
      const status = String(getStatus(service)).toLowerCase();

      return (
        status.includes("open") ||
        status.includes("active") ||
        status.includes("upcoming") ||
        status.includes("no application required")
      );
    }).length;

    const categoryCount = new Set(
      fundingServices
        .map((service) => getCategory(service))
        .filter(Boolean)
        .map((value) => String(value))
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
    const value = String(status || "")
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

  const getCellKey = (serviceId, column) => {
    return `${serviceId}-${column}`;
  };

  const toggleCell = (serviceId, column) => {
    const key = getCellKey(serviceId, column);

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
      rawValue = getProgramName(service);
    } else {
      rawValue = getValue(service, [column]);
    }

    const value = isAmountField(column)
      ? formatCanadianAmount(rawValue)
      : formatValue(rawValue);

    const cellKey = getCellKey(service.id, column);
    const isExpanded = expandedCells[cellKey];

    const isStatusColumn =
      column.toLowerCase() === "status";

    const shouldShowMore = value.length > 100;
    const status = getStatusStyle(value);

    /* STATUS */

    if (isStatusColumn && value !== "-") {
      return (
        <span
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold"
          style={{
            backgroundColor: status.background,
            color: status.color,
            borderColor: status.border,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: status.dot,
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

    const visibleValue = isExpanded
      ? value
      : `${value.slice(0, 100)}...`;

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
            toggleCell(service.id, column)
          }
          className="ml-2 whitespace-nowrap text-xs font-bold text-teal-600 underline decoration-teal-200 underline-offset-2 transition hover:text-teal-800"
        >
          {isExpanded ? "See Less" : "See More"}
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

    document.body.style.overflow = "hidden";
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

    setFormData({ ...initialFormData });

    setShowApplication(true);

    document.body.style.overflow = "hidden";
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

    document.body.style.overflow = "";
  };

  /* =========================================================
     FORM INPUT
     ========================================================= */

  const handleInputChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* =========================================================
     SUBMIT APPLICATION
     ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isHuman) {
      setApplicationError(
        "Please confirm that you are human."
      );
      return;
    }

    if (!formData.consent) {
      setApplicationError(
        "Please provide consent before submitting your application."
      );
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
          result.message ||
            "Failed to submit application."
        );
        return;
      }

      // Close the application form and show success popup.
      setApplicationMessage("");
      setApplicationError("");
      setShowApplication(false);
      setShowSuccessPopup(true);

      // Reset the form.
      setFormData({ ...initialFormData });
      setIsHuman(false);
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
      .getElementById("funding-opportunities")
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
        <div className="mx-auto flex w-full max-w-[1800px] flex-col items-stretch gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:min-h-[74px] xl:flex-row xl:items-center xl:justify-between xl:gap-5 xl:py-0 2xl:px-12">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-5">
            <a
              href="https://ibsgroupcanada.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit IBS Group Canada website"
              className="h-10 w-10 shrink-0 overflow-hidden rounded-xl sm:h-12 sm:w-12"
            >
              <img
                src="/logo.jpg"
                alt="IBS Logo"
                className="h-full w-full object-cover"
              />
            </a>

            <a
              href="/"
              aria-label="Go to Funding Program Portal homepage"
              className="group flex min-w-0 flex-col gap-1"
            >
              <span className="text-xs font-extrabold leading-tight tracking-[-0.02em] text-white transition-colors duration-300 group-hover:text-[#7DD3FC] min-[380px]:text-sm sm:text-base md:text-lg">
                Innovative Business Solutions Ltd.
              </span>

              <span className="text-[10px] font-medium leading-relaxed tracking-[0.01em] text-slate-400 min-[380px]:text-xs sm:text-sm">
                Funding found. Applications supported by IBS.
              </span>
            </a>
          </div>

          <nav className="flex w-full flex-wrap items-center justify-start gap-x-7 gap-y-3 border-t border-white/10 pt-4 sm:justify-center sm:gap-x-9 xl:w-auto xl:shrink-0 xl:flex-nowrap xl:justify-end xl:gap-x-8 xl:border-0 xl:pt-0 2xl:gap-x-10">
            <a
              href="/"
              className="inline-flex shrink-0 flex-col items-start gap-2 whitespace-nowrap text-xs font-semibold text-slate-300 transition-colors duration-300 hover:text-[#7DD3FC] sm:text-sm"
            >
              <span>Funding Programs</span>
              <span className="h-[2px] w-full rounded-full bg-[#7DD3FC]" />
            </a>

            <a
              href="/news"
              className="inline-flex shrink-0 flex-col items-start gap-2 whitespace-nowrap text-xs font-semibold text-slate-300 transition-colors duration-300 hover:text-[#7DD3FC] sm:text-sm"
            >
              <span>News & Updates</span>
              <span className="h-[2px] w-full rounded-full bg-[#7DD3FC]" />
            </a>

            <a
              href="https://ibsgroupcanada.com/about/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 flex-col items-start gap-2 whitespace-nowrap text-xs font-semibold text-slate-300 transition-colors duration-300 hover:text-[#7DD3FC] sm:text-sm"
            >
              <span>About Us</span>
              <span className="h-[2px] w-full rounded-full bg-[#7DD3FC]" />
            </a>

            <a
              href="/login"
              className="shrink-0 rounded-lg border border-[#7DD3FC]/30 bg-[#2374A8]/20 px-3 py-2 text-xs font-bold text-white transition-all duration-300 hover:border-[#7DD3FC]/70 hover:bg-[#2374A8]/40 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Staff Login
            </a>
          </nav>
        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative isolate overflow-hidden bg-[#061525] text-white">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage: "url('/funding-hero.png')",
          }}
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute -right-32 -top-40 h-72 w-72 rounded-full bg-teal-400/15 blur-[90px] sm:h-96 sm:w-96" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-blue-500/10 blur-[90px] sm:h-96 sm:w-96" />

        <div className="relative mx-auto w-full max-w-[1800px] px-4 py-10 sm:px-6 sm:py-12 md:py-16 lg:px-10 lg:py-20 xl:px-14">
          <div className="grid min-w-0 grid-cols-1 items-center gap-9 sm:gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.8fr)] lg:gap-10 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.8fr)] xl:gap-16">
            <div className="min-w-0">
              <h1 className="max-w-4xl break-words text-[clamp(2rem,7vw,4.5rem)] font-black leading-[1.08] tracking-[-0.045em] text-[#0B2438]">
                Find the right
                <span className="mt-1 block pb-1 text-[#0B2438]">
                  funding for your business
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#43515C] sm:mt-6 sm:text-base sm:leading-8 lg:text-lg">
                Explore funding programs, grants and financial support
                opportunities from government and partner organizations —
                all in one convenient place.
              </p>

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

              <div className="mt-8 flex items-center gap-3 sm:mt-11">
                <div className="h-1 w-14 rounded-full bg-gradient-to-r from-[#2374A8] to-[#5B9BD5] sm:w-16" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="relative z-10 mx-auto -mt-10 w-full max-w-[1250px] px-4 sm:-mt-12 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            {
              // value: statistics.total,
              value: 0,

              label: "New this week",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect x="5" y="3" width="14" height="18" rx="2.5" />
                  <path d="M9 8h6M9 12h6M9 16h3" />
                </svg>
              ),
              color: "text-[#2374A8]",
              iconBg: "bg-[#2374A8]/10",
              accent: "bg-[#2374A8]",
              border: "hover:border-[#2374A8]/50",
            },
            {
              value: statistics.open,
              label: "Open now",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8 12 2.5 2.5L16 9" />
                </svg>
              ),
              color: "text-[#2374A8]",
              iconBg: "bg-[#2374A8]/10",
              accent: "bg-[#2374A8]",
              border: "hover:border-[#2374A8]/50",
            },
            {
              // value: statistics.categories,
                 value: 0,
              label: "Closing in 14 days",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect x="3" y="3" width="8" height="8" rx="2" />
                  <rect x="13" y="3" width="8" height="8" rx="2" />
                  <rect x="3" y="13" width="8" height="8" rx="2" />
                  <rect x="13" y="13" width="8" height="8" rx="2" />
                </svg>
              ),
              color: "text-[#0B6FB3]",
              iconBg: "bg-[#7DD3FC]/20",
              accent: "bg-[#7DD3FC]",
              border: "hover:border-[#7DD3FC]",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_25px_-12px_rgba(11,36,56,0.20)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-4 ${stat.border}`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 ${stat.accent}`}
              />

              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#EEF5F8] opacity-90 blur-2xl" />

              <div className="relative flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} ${stat.color} ring-1 ring-inset ring-black/[0.03] transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11`}
                >
                  {stat.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-2xl font-extrabold leading-tight tracking-tight ${stat.color} sm:text-3xl`}
                  >
                    {loading ? (
                      <span className="inline-block h-7 w-12 animate-pulse rounded-md bg-[#EEF5F8]" />
                    ) : (
                      stat.value
                    )}
                  </p>

                  <h3 className="mt-1 break-words text-sm font-bold leading-snug text-[#0B2438] sm:text-base">
                    {stat.label}
                  </h3>
                </div>
              </div>

              <div
                className={`absolute inset-x-4 bottom-0 h-[2px] ${stat.accent} opacity-80`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================
          FEATURED FUNDING PROGRAMS
      ===================================================== */}

      {!loading && featuredPrograms.length > 0 && (
        <section className="mx-auto w-full max-w-[1800px] px-4 pt-10 py-2 sm:px-6 sm:pt-12 lg:px-10 lg:pt-16 xl:px-12">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#2374A8]">
                Explore opportunities
              </p>

              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#0B2438] sm:text-2xl">
                Featured Funding Programs
              </h2>

              <p className="mt-1 text-sm text-[#43515C]">
                Discover selected opportunities and find the right support for your needs.
              </p>
            </div>

            <button
              type="button"
              onClick={scrollToOpportunities}
              className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[#2374A8] transition hover:text-[#0B2438]"
            >
              View all programs <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => moveFeaturedCarousel(-1)}
              aria-label="Previous featured funding programs"
              className="absolute -left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#2374A8]/20 bg-white text-xl font-bold text-[#0B2438] shadow-lg transition hover:border-[#2374A8] hover:bg-[#2374A8] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2374A8] sm:-left-4 sm:h-11 sm:w-11"
            >
              <span aria-hidden="true">‹</span>
            </button>

            <div
              ref={featuredCarouselRef}
              className="flex items-stretch snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {featuredPrograms.map((service) => {
                const deadline = getValue(service, [
                  "Deadline",
                  "Application Deadline",
                  "Closing Date",
                  "End Date",
                ]);

                const amount = getValue(service, [
                  "Amount Max",
                  "Maximum Amount",
                  "Max Amount",
                  "Funding Amount",
                ]);

                const purpose = getValue(service, [
                  "Purpose",
                  "Program Purpose",
                  "Description",
                ]);

                const status = getStatus(service) || "Status not specified";

                return (
                  <article
                    key={service.id}
                    className="group relative flex h-[400px] w-full min-w-0 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_25px_-16px_rgba(11,36,56,0.35)] transition duration-300 hover:-translate-y-1 hover:border-[#2374A8]/40 hover:shadow-lg sm:h-[400px] sm:w-[calc(50%-8px)] xl:h-[400px] xl:w-[calc(25%-12px)]"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2 pl-0">
                      <span
                        className="inline-flex items-center gap-1.5 bg-[#2374A8] py-2 pl-3 pr-5 text-[11px] font-bold text-white shadow-sm"
                        style={{
                          clipPath:
                            "polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%)",
                        }}
                      >
                        <span aria-hidden="true">★</span>
                        Featured
                      </span>

                      <span className="max-w-[50%] truncate rounded-md border border-[#2374A8] bg-[#2374A8] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-sm">
                        {status}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-extrabold leading-snug text-[#0B2438] sm:text-lg">
                        {getProgramName(service)}
                      </h3>

                      <span className="mt-3 w-fit max-w-full truncate rounded-md border border-[#2374A8]/20 bg-[#EEF5F8] px-2 py-1 text-[11px] font-semibold text-[#0B2438]">
                        {getCategory(service)}
                      </span>

                      {purpose && formatValue(purpose) !== "-" && (
                        <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-[#43515C]">
                          {formatValue(purpose)}
                        </p>
                      )}

                      <div className="mt-4 space-y-1.5 text-xs text-[#43515C]">
                        {deadline && formatValue(deadline) !== "-" && (
                          <p className="break-words">
                            <span className="font-bold text-[#0B2438]">
                              Deadline:
                            </span>{" "}
                            {formatValue(deadline)}
                          </p>
                        )}

                        {amount && formatValue(amount) !== "-" && (
                          <p className="break-words">
                            <span className="font-bold text-[#0B2438]">
                              Maximum amount:
                            </span>{" "}
                            {formatCanadianAmount(amount)}
                          </p>
                        )}
                      </div>

                      <div className="mt-10 grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => handleApply(service)}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#0B7285] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#075B6B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2374A8] focus-visible:ring-offset-2"
                        >
                          Get help applying
                        </button>

                        <button
                          type="button"
                          onClick={() => handleView(service)}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#0B7285]/50 bg-white px-3 py-2 text-xs font-bold text-[#0B2438] transition hover:bg-[#EEF5F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2374A8] focus-visible:ring-offset-2"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => moveFeaturedCarousel(1)}
              aria-label="Next featured funding programs"
              className="absolute -right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#2374A8]/20 bg-white text-xl font-bold text-[#0B2438] shadow-lg transition hover:border-[#2374A8] hover:bg-[#2374A8] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2374A8] sm:-right-4 sm:h-11 sm:w-11"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </section>
      )}

      {/* =====================================================
          FUNDING OPPORTUNITIES
      ===================================================== */}

      <section
        id="funding-opportunities"
        className="w-full scroll-mt-24 px-3 py-5 sm:px-5 sm:py-7 lg:px-8 xl:px-10"
      >


                {/* ===================================================
            APPLICANT, TERRITORY AND CATEGORY FILTERS
        =================================================== */}

    

<div className="mx-auto mb-6 w-full max-w-[1900px]">
  <div className="overflow-hidden rounded-2xl border border-[#C8D8E2] bg-white shadow-xl shadow-[#0B2438]/[0.08] sm:rounded-3xl">

    {/* HEADER */}
    <div className="relative overflow-hidden bg-gradient-to-r from-[#0B2438] via-[#123D59] to-[#2374A8] px-5 py-6 sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full bg-white/[0.07] blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-24 w-48 rounded-full bg-[#14B8A6]/20 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#DCECF6]">
            <span className="h-2 w-2 rounded-full bg-[#5EEAD4]" />
            Find the right program
          </span>

          <h2 className="mt-3 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Filter funding opportunities
          </h2>

          {/* <p className="mt-2 max-w-2xl text-sm leading-6 text-[#E0EAF1]">
            Choose your applicant type, territory and categories.
            Multiple selections match any selected option.
          </p> */}
        </div>

        <button
          type="button"
          onClick={clearFilters}
          disabled={
            selectedApplicantTypes.length === 0 &&
            !selectedTerritory &&
            !selectedCommunity &&
            selectedCategories.length === 0
          }
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:border-white/40 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 7h16M10 3h4M7 7l1 13h8l1-13M10 11v5M14 11v5"
            />
          </svg>
          Clear filters
        </button>
      </div>
    </div>

    {/* FILTER PANELS */}
    <div className="bg-[#F2F6F9] p-3 sm:p-5 lg:p-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(240px,0.85fr)_minmax(0,1.15fr)]">

        {/* WHO YOU ARE */}
        <section className="min-w-0 rounded-2xl border border-[#D7E2EA] bg-white shadow-sm transition hover:shadow-md">
          <div className="flex items-center gap-3 border-b border-[#E5EDF2] px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E5F1F8] text-[#0B496A]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6m3-3h-6"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-[#0B2438]">
                Who you are
              </h3>
              <p className="mt-0.5 text-xs text-[#647785]">
                Select one or more applicant types
              </p>
            </div>

            {selectedApplicantTypes.length > 0 && (
              <span className="ml-auto rounded-full bg-[#0B2438] px-2.5 py-1 text-[10px] font-extrabold text-white">
                {selectedApplicantTypes.length}
              </span>
            )}
          </div>

          <div className="max-h-[300px] space-y-1 overflow-y-auto p-3">
            {APPLICANT_TYPES.map((type) => {
              const checked =
                type === "Not sure"
                  ? selectedApplicantTypes.length === 0
                  : selectedApplicantTypes.includes(type);

              return (
                <label
                  key={type}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm leading-5 transition ${
                    checked && type !== "Not sure"
                      ? "border-[#2374A8]/40 bg-[#EAF4FA] font-semibold text-[#0B2438]"
                      : "border-transparent bg-white text-[#43515C] hover:border-[#D8E6EF] hover:bg-[#F5F9FC]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleApplicantType(type)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#0F766E]"
                  />
                  <span>{type}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* TERRITORY / PROVINCE */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#B8D4E5] bg-[#E8F3F9] shadow-sm transition hover:shadow-md">
          <div className="flex items-center gap-3 border-b border-[#CFE1EC] bg-[#D9EBF5] px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B2438] text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21s7-5.5 7-12a7 7 0 1 0-14 0c0 6.5 7 12 7 12Z"
                />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-[#0B2438]">
                Location
              </h3>
              <p className="mt-0.5 text-xs text-[#435F70]">
                Territory and community
              </p>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <label
                htmlFor="territory-filter"
                className="mb-2 block text-xs font-extrabold text-[#0B2438]"
              >
                Territory / Province
              </label>

              <select
                id="territory-filter"
                value={selectedTerritory}
                onChange={(event) => {
                  setSelectedTerritory(event.target.value);
                  setSelectedCommunity("");
                }}
                className="h-11 w-full rounded-xl border border-[#B9D0DE] bg-white px-3 text-sm font-medium text-[#243F50] outline-none transition hover:border-[#2374A8] focus:border-[#2374A8] focus:ring-4 focus:ring-[#2374A8]/15"
              >
                <option value="">All territories and provinces</option>
                {TERRITORIES.map((territory) => (
                  <option key={territory} value={territory}>
                    {territory}
                  </option>
                ))}
              </select>
            </div>

            {selectedTerritory && (
              <div>
                <label
                  htmlFor="community-filter"
                  className="mb-2 block text-xs font-extrabold text-[#0B2438]"
                >
                  Community
                  <span className="ml-1 font-medium text-[#647785]">
                    (optional)
                  </span>
                </label>

                {TERRITORY_COMMUNITIES[selectedTerritory] ? (
                  <select
                    id="community-filter"
                    value={selectedCommunity}
                    onChange={(event) =>
                      setSelectedCommunity(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-[#B9D0DE] bg-white px-3 text-sm text-[#243F50] outline-none transition hover:border-[#2374A8] focus:border-[#2374A8] focus:ring-4 focus:ring-[#2374A8]/15"
                  >
                    <option value="">All communities</option>
                    {TERRITORY_COMMUNITIES[selectedTerritory].map(
                      (community) => (
                        <option key={community} value={community}>
                          {community}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <input
                    id="community-filter"
                    type="text"
                    value={selectedCommunity}
                    onChange={(event) =>
                      setSelectedCommunity(event.target.value)
                    }
                    placeholder="Enter community name"
                    className="h-11 w-full rounded-xl border border-[#B9D0DE] bg-white px-3 text-sm text-[#243F50] outline-none transition placeholder:text-[#8294A0] hover:border-[#2374A8] focus:border-[#2374A8] focus:ring-4 focus:ring-[#2374A8]/15"
                  />
                )}
              </div>
            )}

            <div className="rounded-xl border border-[#C5DDEB] bg-white/75 px-3 py-3">
              <p className="text-xs leading-5 text-[#435F70]">
                <span className="font-extrabold text-[#0B2438]">
                  Good to know:
                </span>{" "}
                Territory searches include matching regional and Canada-wide
                programs. NWT and Nunavut use community lists.
              </p>
            </div>
          </div>
        </section>

        {/* CATEGORY */}
        <section className="min-w-0 rounded-2xl border border-[#D7E2EA] bg-white shadow-sm transition hover:shadow-md">
          <div className="flex items-center gap-3 border-b border-[#E5EDF2] px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CCFBF1] text-[#0F766E]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 5h16M4 12h16M4 19h16M8 2v6m8 4v6m-5 1v6"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-[#0B2438]">
                Funding category
              </h3>
              <p className="mt-0.5 text-xs text-[#647785]">
                Select one or more categories
              </p>
            </div>

            {selectedCategories.length > 0 && (
              <span className="ml-auto rounded-full bg-[#0F766E] px-2.5 py-1 text-[10px] font-extrabold text-white">
                {selectedCategories.length}
              </span>
            )}
          </div>

          <div className="max-h-[300px] space-y-2 overflow-y-auto p-3">
            {categoryTree.map((category) => (
              <div
                key={category.name}
                className="rounded-xl border border-[#E5EDF2] bg-[#FAFCFD] p-2 transition hover:border-[#C7DCE8]"
              >
                {/* Parent category */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm leading-5 transition ${
                    selectedCategories.includes(category.name)
                      ? "bg-[#CCFBF1] font-bold text-[#115E59]"
                      : "text-[#243F50] hover:bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => toggleCategory(category.name)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#0F766E]"
                  />
                  <span>{category.name}</span>
                </label>

                {/* Independent subcategories */}
                {category.children.map((child) => {
                  const childKey = `${category.name}::${child}`;
                  const childChecked =
                    selectedCategories.includes(childKey);

                  return (
                    <label
                      key={childKey}
                      className={`ml-5 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm leading-5 transition ${
                        childChecked
                          ? "bg-[#EAF4FA] font-semibold text-[#0B496A]"
                          : "text-[#526875] hover:bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={childChecked}
                        onChange={() => toggleCategory(childKey)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#2374A8]"
                      />
                      <span>{child}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>

    {/* RESULTS SUMMARY */}
    <div className="flex flex-col gap-3 border-t border-[#D7E2EA] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B2438] text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12h14M12 5l7 7-7 7"
            />
          </svg>
        </div>

        <div>
          <p className="text-sm font-extrabold text-[#0B2438]">
            {searchedServices.length}{" "}
            {searchedServices.length === 1
              ? "program matches"
              : "programs match"}
          </p>
          <p className="mt-0.5 text-xs text-[#647785]">
            Based on your selected filters
          </p>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs font-medium text-[#526875]">
        <span className="h-2 w-2 rounded-full bg-[#2374A8]" />
        Programs with a closed status are hidden.
      </p>
    </div>
  </div>
</div>



        {/* ===================================================
            FUNDING TABLE
        =================================================== */}

        {!loading && filteredServices.length > 0 && (
          <div className="mx-auto w-full max-w-[1900px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/[0.04]">
            {/* TABLE HEADER */}

            <div className="flex flex-col justify-between gap-3 bg-[#071a2d] px-4 py-4 sm:flex-row sm:items-center sm:px-5">
              <div>
                <h3 className="text-sm font-black text-white">
                  Available Funding Programs
                </h3>
                {/* <p className="mt-1 text-xs text-slate-400">
                  Customer-approved funding information
                </p> */}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                <label className="relative block w-full sm:w-64">
                  <span className="sr-only">Search funding programs</span>
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" aria-hidden="true">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path strokeLinecap="round" d="m20 20-4-4" />
                    </svg>
                  </span>
                  <input
                    type="search"
                    value={tableSearch}
                    onChange={(event) => setTableSearch(event.target.value)}
                    placeholder="Search programs..."
                    aria-label="Search funding programs"
                    className="w-full rounded-lg border border-white/15 bg-white px-3 py-2 pl-9 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                  />
                </label>

                <span className="whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-teal-300">
                  {searchedServices.length} records
                </span>
              </div>
            </div>

            {/* TABLE CONTAINER */}

            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
              <table
                className="w-full min-w-[1900px] border-collapse"
                style={{ tableLayout: "auto" }}
              >
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th
                      className="sticky left-0 z-30 whitespace-nowrap border-r border-slate-200 bg-slate-50 px-5 py-4 text-center text-[11px] font-black uppercase tracking-wider text-slate-500"
                      style={{ width: "70px", minWidth: "70px" }}
                    >
                      #
                    </th>

                    {CUSTOMER_COLUMNS.map((column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap border-r border-slate-100 px-6 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-500"
                        style={{
                          width: COLUMN_WIDTHS[column],
                          minWidth: COLUMN_WIDTHS[column],
                        }}
                      >
                        {column}
                      </th>
                    ))}

                    <th
                      className="sticky right-0 z-30 whitespace-nowrap border-l border-slate-200 bg-slate-50 px-6 py-4 text-center text-[11px] font-black uppercase tracking-wider text-slate-500"
                      style={{ width: "190px", minWidth: "190px" }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {searchedServices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={CUSTOMER_COLUMNS.length + 2}
                        className="px-6 py-14 text-center"
                      >
                        <div className="text-sm font-bold text-slate-700">
                          No matching funding programs
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Try a different search term or clear the search.
                        </p>
                        <button
                          type="button"
                          onClick={() => setTableSearch("")}
                          className="mt-3 rounded-lg bg-[#071a2d] px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-600"
                        >
                          Clear Search
                        </button>
                      </td>
                    </tr>
                  ) : paginatedServices.map((service, serviceIndex) => {
                    const globalIndex =
                      (currentPage - 1) * itemsPerPage + serviceIndex;

                    const isEvenRow = serviceIndex % 2 === 0;

                    return (
                      <tr
                        key={service.id}
                        className={`group border-b border-slate-200 transition-all duration-200 ${
                          isEvenRow
                            ? "bg-white hover:bg-teal-50"
                            : "bg-[#eaf4f7] hover:bg-teal-100"
                        }`}
                      >
                        {/* ROW NUMBER */}

                        <td
                          className={`sticky left-0 z-20 border-r border-slate-200 px-5 py-5 text-center align-top ${
                            isEvenRow
                              ? "bg-white group-hover:bg-teal-50"
                              : "bg-[#eaf4f7] group-hover:bg-teal-100"
                          }`}
                          style={{ width: "70px", minWidth: "70px" }}
                        >
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#071a2d] px-2 text-xs font-black text-teal-300 transition-all group-hover:bg-teal-500 group-hover:text-[#071a2d]">
                            {globalIndex + 1}
                          </span>
                        </td>

                        {/* CUSTOMER DATA */}

                        {CUSTOMER_COLUMNS.map((column, columnIndex) => (
                          <td
                            key={`${service.id}-${column}`}
                            className="whitespace-normal border-r border-slate-200 px-6 py-5 align-top text-sm"
                            style={{
                              width: COLUMN_WIDTHS[column],
                              minWidth: COLUMN_WIDTHS[column],
                            }}
                          >
                            {renderTableValue(service, column, columnIndex)}
                          </td>
                        ))}

                        {/* ACTIONS */}

                        <td
                          className="sticky right-0 border-l border-slate-200 bg-white px-6 py-5 align-top"
                          style={{
                            width: "190px",
                            minWidth: "190px",
                            backgroundColor: "#ffffff",
                            zIndex: 99,
                          }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleView(service)}
                              className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700"
                            >
                              View Details
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApply(service)}
                              className="whitespace-nowrap rounded-lg bg-[#071a2d] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-teal-600"
                            >
                              Get help applying
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            <div className="flex flex-col gap-5 border-t border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-medium text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-800">
                    {searchedServices.length === 0
                      ? 0
                      : (currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-slate-800">
                    {Math.min(
                      currentPage * itemsPerPage,
                      searchedServices.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-800">
                    {searchedServices.length}
                  </span>{" "}
                  records
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Rows:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(event) => {
                      setItemsPerPage(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-teal-400"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) => {
                      if (page === "...") {
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
                          onClick={() => setCurrentPage(page)}
                          className={`h-9 min-w-9 rounded-lg px-2.5 text-xs font-black transition ${
                            currentPage === page
                              ? "bg-[#071a2d] text-white shadow-md"
                              : "border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
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

        {/* LOADING STATE */}

        {loading && (
          <div className="mx-auto w-full max-w-[1900px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="flex h-14 animate-pulse items-center bg-slate-100 px-5">
              <div className="h-4 w-52 rounded bg-slate-200" />
            </div>

            {[1, 2, 3, 4, 5].map((row) => (
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
            ))}
          </div>
        )}

        {/* EMPTY STATE */}

        {!loading && filteredServices.length === 0 && (
          <div className="mx-auto w-full max-w-[1900px] rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
              ⌕
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-900">
              No funding opportunities found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try changing your search term or selecting another category.
            </p>

            <button
              type="button"
              onClick={clearFilters}
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
      ===================================================== */}

      {selectedService && !showApplication && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#020b15]/80 p-2 backdrop-blur-md sm:p-4"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-[28px]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="bg-[#071a2d] px-4 py-4 sm:px-6 sm:py-6 md:px-8">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0" />

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close details"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl text-white transition hover:bg-white/20"
                >
                  ×
                </button>
              </div>
            </div>

            {/* DETAILS */}

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 md:p-8">
              <div className="mb-6 rounded-2xl border border-teal-100 bg-teal-50 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-teal-600">
                  Program
                </p>

                <p className="mt-1 text-lg font-black text-slate-900">
                  {getProgramName(selectedService)}
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
                      {CUSTOMER_COLUMNS.map((key, index) => {
                        const value =
                          key === "Program Name"
                            ? getProgramName(selectedService)
                            : getValue(selectedService, [key]);

                        const formattedValue = isAmountField(key)
                          ? formatCanadianAmount(value)
                          : formatValue(value);
                        const isStatus = key.toLowerCase() === "status";
                        const status = getStatusStyle(formattedValue);

                        return (
                          <tr
                            key={key}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="bg-slate-50/50 px-4 py-4 text-center align-top text-xs font-black text-slate-400">
                              {index + 1}
                            </td>

                            <td className="bg-slate-50/50 px-5 py-4 align-top text-xs font-bold text-slate-600">
                              {key}
                            </td>

                            <td className="break-words px-5 py-4 text-sm leading-6 text-slate-700">
                              {isStatus && formattedValue !== "-" ? (
                                <span
                                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold"
                                  style={{
                                    backgroundColor: status.background,
                                    color: status.color,
                                    borderColor: status.border,
                                  }}
                                >
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{
                                      backgroundColor: status.dot,
                                    }}
                                  />
                                  {formattedValue}
                                </span>
                              ) : (
                                formattedValue
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* FOOTER ACTIONS */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleApply(selectedService)}
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

      {selectedService && showApplication && (
        <div
          className="fixed inset-0 z-[1000000] flex items-center justify-center overflow-y-auto bg-[#020b15]/80 p-2 backdrop-blur-md sm:p-4"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[94vh] sm:rounded-[28px]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="bg-[#071a2d] px-4 py-4 sm:px-6 sm:py-6 md:px-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="mb-3 inline-flex rounded-full bg-teal-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                    Application
                  </div>
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
              className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 md:p-8"
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                {/* NAME */}

                <div>
                  <label
                    htmlFor="application-name"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Name *
                  </label>

                  <input
                    id="application-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    autoComplete="name"
                    placeholder="Enter your full name"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                {/* ORGANIZATION */}

                <div>
                  <label
                    htmlFor="application-company"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Organization *
                  </label>

                  <input
                    id="application-company"
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    autoComplete="organization"
                    placeholder="Enter organization name"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                {/* WHO YOU ARE */}

                <div>
                  <label
                    htmlFor="application-who-you-are"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Who you are *
                  </label>

                  <input
                    id="application-who-you-are"
                    type="text"
                    name="whoYouAre"
                    value={formData.whoYouAre}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Business owner, community representative"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                {/* TERRITORY / PROVINCE */}

                <div>
                  <label
                    htmlFor="application-province"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Territory / Province *
                  </label>

                  <input
                    id="application-province"
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    required
                    autoComplete="address-level1"
                    placeholder="Enter territory or province"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                {/* COMMUNITY */}

                <div>
                  <label
                    htmlFor="application-community"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Community *
                  </label>

                  <input
                    id="application-community"
                    type="text"
                    name="community"
                    value={formData.community}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your community"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="application-email"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Email *
                  </label>

                  <input
                    id="application-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    autoComplete="email"
                    placeholder="Enter email address"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label
                    htmlFor="application-phone"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Phone *
                  </label>

                  <input
                    id="application-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    autoComplete="tel"
                    placeholder="Enter phone number"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                {/* MESSAGE */}

                <div className="sm:col-span-2">
                  <label
                    htmlFor="application-message"
                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    Message *
                  </label>

                  <textarea
                    id="application-message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder="Tell us about your funding requirements..."
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                {/* CONSENT */}

                <div className="sm:col-span-2">
                  <label
                    htmlFor="application-consent"
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <input
                      id="application-consent"
                      type="checkbox"
                      name="consent"
                      checked={formData.consent}
                      onChange={(event) => {
                        setFormData((previous) => ({
                          ...previous,
                          consent: event.target.checked,
                        }));

                        if (event.target.checked) {
                          setApplicationError("");
                        }
                      }}
                      required
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-teal-600"
                    />

                    <span className="text-sm leading-6 text-slate-600">
                      I consent to IBS collecting and using the information I
                      have provided to respond to my funding inquiry and
                      process my application. *
                    </span>
                  </label>
                </div>
              </div>

              {/* HUMAN CHECK */}

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
                  {submitting ? "Submitting..." : "Submit Application →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          SUCCESS POPUP
      ===================================================== */}

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