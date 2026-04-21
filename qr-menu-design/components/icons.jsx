// Lucide-style stroked icons (1.5 stroke)
const Ic = ({ d, size = 16, children, fill = 'none', stroke = 'currentColor', sw = 1.5, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
    {d ? <path d={d} /> : children}
  </svg>
);

const IDashboard = (p) => <Ic {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></Ic>;
const IMenus = (p) => <Ic {...p}><path d="M3 3h12a3 3 0 0 1 3 3v15H6a3 3 0 0 1-3-3V3z"/><path d="M8 7h6M8 11h6M8 15h4"/></Ic>;
const IAnalytics = (p) => <Ic {...p}><path d="M3 3v18h18"/><path d="M7 15l3-3 3 3 5-5"/></Ic>;
const IPromo = (p) => <Ic {...p}><path d="M20.59 13.41L13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none"/></Ic>;
const IQr = (p) => <Ic {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3M20 14v3M14 17v4M17 17h4M14 21h3"/></Ic>;
const ISettings = (p) => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Ic>;
const ILock = (p) => <Ic {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></Ic>;
const ISearch = (p) => <Ic {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></Ic>;
const IBell = (p) => <Ic {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></Ic>;
const IPlus = (p) => <Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>;
const IExternal = (p) => <Ic {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></Ic>;
const IChevLeft = (p) => <Ic {...p}><path d="M15 18l-6-6 6-6"/></Ic>;
const IChevRight = (p) => <Ic {...p}><path d="M9 18l6-6-6-6"/></Ic>;
const IChevDown = (p) => <Ic {...p}><path d="M6 9l6 6 6-6"/></Ic>;
const IArrowUp = (p) => <Ic {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Ic>;
const IArrowRight = (p) => <Ic {...p}><path d="M5 12h14M12 5l7 7-7 7"/></Ic>;
const ILogout = (p) => <Ic {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></Ic>;
const IMore = (p) => <Ic {...p}><circle cx="12" cy="5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none"/></Ic>;
const ICheck = (p) => <Ic {...p}><path d="M5 12l5 5 9-11"/></Ic>;
const ICircCheck = (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></Ic>;
const IEdit = (p) => <Ic {...p}><path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Ic>;
const ITrend = (p) => <Ic {...p}><path d="M22 7l-9 9-4-4L2 19"/><path d="M16 7h6v6"/></Ic>;
const IClock = (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Ic>;
const ITag = (p) => <Ic {...p}><path d="M20.59 13.41L13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/></Ic>;
const ISparkle = (p) => <Ic {...p}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"/></Ic>;
const IUtensils = (p) => <Ic {...p}><path d="M3 2v7a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2"/><path d="M6 12v10"/><path d="M18 2c-2 0-3 2-3 5v5h3v10"/></Ic>;
const IGlobe = (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Ic>;
const ISmartphone = (p) => <Ic {...p}><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></Ic>;
const ILeaf = (p) => <Ic {...p}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/></Ic>;

const IGrid = (p) => <Ic {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Ic>;
const IList = (p) => <Ic {...p}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></Ic>;
const IFilter = (p) => <Ic {...p}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></Ic>;
const ISort = (p) => <Ic {...p}><path d="M3 6h18M6 12h12M10 18h4"/></Ic>;
const IDrag = (p) => <Ic {...p}><circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/></Ic>;
const IChevUp = (p) => <Ic {...p}><path d="M6 15l6-6 6 6"/></Ic>;
const IShare = (p) => <Ic {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></Ic>;
const IUpload = (p) => <Ic {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></Ic>;
const IImage = (p) => <Ic {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></Ic>;
const IType = (p) => <Ic {...p}><path d="M4 7V4h16v3M9 20h6M12 4v16"/></Ic>;
const IDot = (p) => <Ic {...p}><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></Ic>;
const IX = (p) => <Ic {...p}><path d="M18 6L6 18M6 6l12 12"/></Ic>;
const ICoffee = (p) => <Ic {...p}><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></Ic>;
const IEye = (p) => <Ic {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ic>;
const IArchive = (p) => <Ic {...p}><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/></Ic>;
const ICamera = (p) => <Ic {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></Ic>;
const ITrash = (p) => <Ic {...p}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></Ic>;
const ICrop = (p) => <Ic {...p}><path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2"/></Ic>;
const IDownload = (p) => <Ic {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></Ic>;
const ICopy = (p) => <Ic {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Ic>;
const IPin = (p) => <Ic {...p}><path d="M12 2l3 6 6 1-4.5 4.5 1.1 6.5L12 17l-5.6 3 1.1-6.5L3 9l6-1z"/></Ic>;
const IMap = (p) => <Ic {...p}><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><path d="M8 2v16M16 6v16"/></Ic>;
const ISpinner = (p) => <Ic {...p}><path d="M21 12a9 9 0 1 1-6.22-8.56"/></Ic>;
const IInfo = (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/></Ic>;
const ICalendar = (p) => <Ic {...p}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Ic>;
const IFish = (p) => <Ic {...p}><path d="M6.5 12c0-3 3-6 8-6 3 0 5 1 7 3-1 2-3 3-3 3s2 1 3 3c-2 2-4 3-7 3-5 0-8-3-8-6z"/><circle cx="17" cy="11" r="0.6" fill="currentColor"/><path d="M6.5 12L3 8v8z"/></Ic>;
const IMilk = (p) => <Ic {...p}><path d="M8 2h8v4l2 3v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9l2-3z"/></Ic>;
const IWheat = (p) => <Ic {...p}><path d="M12 22V12M12 12l-4-4M12 12l4-4M12 8l-4-4M12 8l4-4"/></Ic>;
const IPig = (p) => <Ic {...p}><circle cx="12" cy="13" r="8"/><circle cx="9" cy="12" r="0.8" fill="currentColor"/><circle cx="15" cy="12" r="0.8" fill="currentColor"/><path d="M10 16h4M7 7l2 2M17 7l-2 2"/></Ic>;
const IEgg = (p) => <Ic {...p}><path d="M12 22c-4 0-7-3-7-7 0-6 3-12 7-12s7 6 7 12c0 4-3 7-7 7z"/></Ic>;
const INut = (p) => <Ic {...p}><circle cx="12" cy="12" r="8"/><path d="M8 8c2 2 6 2 8 0M8 16c2-2 6-2 8 0"/></Ic>;
const ISoy = (p) => <Ic {...p}><circle cx="8" cy="10" r="3"/><circle cx="14" cy="14" r="3"/><path d="M5 5l14 14"/></Ic>;

// Settings icons
const IUser = (p) => <Ic {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></Ic>;
const IUsers = (p) => <Ic {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="7" r="2.8"/><path d="M15 14c3.5 0.5 6 3 6 6"/></Ic>;
const IBuilding = (p) => <Ic {...p}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-4h4v4"/></Ic>;
const ICreditCard = (p) => <Ic {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h2"/></Ic>;
const IKey = (p) => <Ic {...p}><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l2 2M14 9l2 2"/></Ic>;
const IShield = (p) => <Ic {...p}><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/><path d="M9 12l2 2 4-4"/></Ic>;
const IMonitor = (p) => <Ic {...p}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></Ic>;
const IPhone = (p) => <Ic {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Ic>;
const IWarning = (p) => <Ic {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></Ic>;
const IMail = (p) => <Ic {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></Ic>;
const ILink = (p) => <Ic {...p}><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1"/></Ic>;
const IInstagram = (p) => <Ic {...p}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/></Ic>;
const IRefresh = (p) => <Ic {...p}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Ic>;
const IStar = (p) => <Ic {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></Ic>;

Object.assign(window, {
  ICamera, ITrash, ICrop, IDownload, ICopy, IPin, IMap, ISpinner, IInfo, ICalendar,
  IFish, IMilk, IWheat, IPig, IEgg, INut, ISoy,
  IUser, IUsers, IBuilding, ICreditCard, IKey, IShield, IMonitor, IPhone, IWarning,
  IMail, ILink, IInstagram, IRefresh, IStar,
});

Object.assign(window, {
  IDashboard, IMenus, IAnalytics, IPromo, IQr, ISettings, ILock, ISearch,
  IBell, IPlus, IExternal, IChevLeft, IChevRight, IChevDown, IChevUp, IArrowUp, IArrowRight,
  ILogout, IMore, ICheck, ICircCheck, IEdit, ITrend, IClock, ITag, ISparkle,
  IUtensils, IGlobe, ISmartphone, ILeaf,
  IGrid, IList, IFilter, ISort, IDrag, IShare, IUpload, IImage, IType, IDot, IX, ICoffee, IEye, IArchive,
});
