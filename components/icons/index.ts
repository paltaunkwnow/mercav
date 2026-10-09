/**
 * Íconos de Mercav: los de lucide-react con una micro-animación cada uno.
 * Se mueven cuando el control que los contiene recibe hover, foco o toque (ver .mv-icon en globals.css)
 * y respetan "reducir movimiento". Importá siempre desde "@/components/icons", nunca desde "lucide-react".
 * Para sumar uno nuevo: importalo de lucide-react con el sufijo Base y exportalo con animated(…, movimiento).
 */
import {
  Activity as ActivityBase,
  AlertCircle as AlertCircleBase,
  AlertTriangle as AlertTriangleBase,
  Archive as ArchiveBase,
  ArrowLeft as ArrowLeftBase,
  ArrowRight as ArrowRightBase,
  ArrowUp as ArrowUpBase,
  ArrowUpRight as ArrowUpRightBase,
  BadgeCheck as BadgeCheckBase,
  BadgePercent as BadgePercentBase,
  Ban as BanBase,
  BarChart3 as BarChart3Base,
  Beer as BeerBase,
  Bell as BellBase,
  BellRing as BellRingBase,
  Bike as BikeBase,
  BookOpen as BookOpenBase,
  BookOpenCheck as BookOpenCheckBase,
  Bookmark as BookmarkBase,
  Briefcase as BriefcaseBase,
  Bug as BugBase,
  Building2 as Building2Base,
  Cake as CakeBase,
  Calculator as CalculatorBase,
  Calendar as CalendarBase,
  CalendarDays as CalendarDaysBase,
  CalendarHeart as CalendarHeartBase,
  CalendarPlus as CalendarPlusBase,
  CalendarRange as CalendarRangeBase,
  Camera as CameraBase,
  Car as CarBase,
  Check as CheckBase,
  CheckCheck as CheckCheckBase,
  CheckCircle2 as CheckCircle2Base,
  CheckIcon as CheckIconBase,
  ChevronDown as ChevronDownBase,
  ChevronLeft as ChevronLeftBase,
  ChevronRight as ChevronRightBase,
  ChevronRightIcon as ChevronRightIconBase,
  ChevronUp as ChevronUpBase,
  CircleCheck as CircleCheckBase,
  CircleHelp as CircleHelpBase,
  CircleSlash as CircleSlashBase,
  Clock as ClockBase,
  Clock3 as Clock3Base,
  CloudOff as CloudOffBase,
  Code as CodeBase,
  Coffee as CoffeeBase,
  Compass as CompassBase,
  Contrast as ContrastBase,
  Copy as CopyBase,
  Cpu as CpuBase,
  CreditCard as CreditCardBase,
  Croissant as CroissantBase,
  Crown as CrownBase,
  Database as DatabaseBase,
  DollarSign as DollarSignBase,
  Download as DownloadBase,
  Droplets as DropletsBase,
  Dumbbell as DumbbellBase,
  Edit2 as Edit2Base,
  Edit3 as Edit3Base,
  ExternalLink as ExternalLinkBase,
  Eye as EyeBase,
  EyeOff as EyeOffBase,
  FileDown as FileDownBase,
  FileSearch as FileSearchBase,
  FileSpreadsheet as FileSpreadsheetBase,
  FileText as FileTextBase,
  Fingerprint as FingerprintBase,
  Flag as FlagBase,
  Flame as FlameBase,
  Flower2 as Flower2Base,
  FolderOpen as FolderOpenBase,
  FolderPlus as FolderPlusBase,
  Gavel as GavelBase,
  Gift as GiftBase,
  Globe as GlobeBase,
  Globe2 as Globe2Base,
  GraduationCap as GraduationCapBase,
  GripVertical as GripVerticalBase,
  Hammer as HammerBase,
  HandHeart as HandHeartBase,
  Handshake as HandshakeBase,
  Hash as HashBase,
  Headphones as HeadphonesBase,
  Heart as HeartBase,
  HelpCircle as HelpCircleBase,
  History as HistoryBase,
  Home as HomeBase,
  Hourglass as HourglassBase,
  IceCreamCone as IceCreamConeBase,
  Image as ImageBase,
  ImageOff as ImageOffBase,
  ImagePlus as ImagePlusBase,
  Inbox as InboxBase,
  Info as InfoBase,
  KeyRound as KeyRoundBase,
  Keyboard as KeyboardBase,
  Landmark as LandmarkBase,
  Languages as LanguagesBase,
  Layers as LayersBase,
  LayoutDashboard as LayoutDashboardBase,
  LayoutGrid as LayoutGridBase,
  Leaf as LeafBase,
  LifeBuoy as LifeBuoyBase,
  Lightbulb as LightbulbBase,
  Link2 as Link2Base,
  LinkIcon as LinkIconBase,
  List as ListBase,
  ListChecks as ListChecksBase,
  Loader2 as Loader2Base,
  LocateFixed as LocateFixedBase,
  Lock as LockBase,
  LockKeyhole as LockKeyholeBase,
  LogIn as LogInBase,
  LogOut as LogOutBase,
  Mail as MailBase,
  Map as MapBase,
  MapPin as MapPinBase,
  MapPinned as MapPinnedBase,
  Maximize as MaximizeBase,
  Medal as MedalBase,
  Megaphone as MegaphoneBase,
  Menu as MenuBase,
  MessageCircle as MessageCircleBase,
  MessageCircleWarning as MessageCircleWarningBase,
  MessageSquare as MessageSquareBase,
  MessagesSquare as MessagesSquareBase,
  Minimize as MinimizeBase,
  Minus as MinusBase,
  MonitorPlay as MonitorPlayBase,
  MonitorSmartphone as MonitorSmartphoneBase,
  Moon as MoonBase,
  MoonStar as MoonStarBase,
  MoreHorizontal as MoreHorizontalBase,
  MoreVertical as MoreVerticalBase,
  MousePointerClick as MousePointerClickBase,
  Navigation as NavigationBase,
  OctagonAlert as OctagonAlertBase,
  Package as PackageBase,
  PackageX as PackageXBase,
  Palette as PaletteBase,
  Paperclip as PaperclipBase,
  PartyPopper as PartyPopperBase,
  Pause as PauseBase,
  PawPrint as PawPrintBase,
  PenTool as PenToolBase,
  Pencil as PencilBase,
  PencilLine as PencilLineBase,
  Phone as PhoneBase,
  Pill as PillBase,
  Pizza as PizzaBase,
  Plane as PlaneBase,
  Play as PlayBase,
  PlugZap as PlugZapBase,
  Plus as PlusBase,
  PlusCircle as PlusCircleBase,
  PlusSquare as PlusSquareBase,
  Printer as PrinterBase,
  QrCode as QrCodeBase,
  Quote as QuoteBase,
  Radar as RadarBase,
  Receipt as ReceiptBase,
  RefreshCcw as RefreshCcwBase,
  RefreshCw as RefreshCwBase,
  Rocket as RocketBase,
  RotateCcw as RotateCcwBase,
  RotateCw as RotateCwBase,
  Rss as RssBase,
  Save as SaveBase,
  Scale as ScaleBase,
  ScanEye as ScanEyeBase,
  ScanLine as ScanLineBase,
  ScanSearch as ScanSearchBase,
  Scissors as ScissorsBase,
  Search as SearchBase,
  Send as SendBase,
  Settings as SettingsBase,
  Settings2 as Settings2Base,
  Share2 as Share2Base,
  Shield as ShieldBase,
  ShieldAlert as ShieldAlertBase,
  ShieldCheck as ShieldCheckBase,
  Shirt as ShirtBase,
  ShoppingBag as ShoppingBagBase,
  ShoppingBasket as ShoppingBasketBase,
  ShoppingCart as ShoppingCartBase,
  SlidersHorizontal as SlidersHorizontalBase,
  Smartphone as SmartphoneBase,
  Sparkles as SparklesBase,
  SquarePen as SquarePenBase,
  Star as StarBase,
  Store as StoreBase,
  Sun as SunBase,
  Sunrise as SunriseBase,
  Tag as TagBase,
  Target as TargetBase,
  ToggleLeft as ToggleLeftBase,
  ToggleRight as ToggleRightBase,
  Trash2 as Trash2Base,
  TrendingUp as TrendingUpBase,
  TriangleAlert as TriangleAlertBase,
  Truck as TruckBase,
  Type as TypeBase,
  Unlock as UnlockBase,
  Upload as UploadBase,
  User as UserBase,
  User2 as User2Base,
  UserCheck as UserCheckBase,
  UserCircle2 as UserCircle2Base,
  UserMinus as UserMinusBase,
  UserPlus as UserPlusBase,
  UserRound as UserRoundBase,
  UserX as UserXBase,
  Users as UsersBase,
  UsersRound as UsersRoundBase,
  UtensilsCrossed as UtensilsCrossedBase,
  Video as VideoBase,
  Wallet as WalletBase,
  WifiOff as WifiOffBase,
  Workflow as WorkflowBase,
  Wrench as WrenchBase,
  X as XBase,
  XCircle as XCircleBase,
  XIcon as XIconBase,
  Zap as ZapBase,
} from "lucide-react";
import { animated } from "./animated";

export type { LucideIcon, LucideProps } from "lucide-react";
export { animated, type IconMotion } from "./animated";
export { ModuleGlyph, type ModuleGlyphKey } from "./ModuleGlyph";

export const ArrowRight = /*#__PURE__*/ animated(ArrowRightBase, "nudge");
export const ChevronRight = /*#__PURE__*/ animated(ChevronRightBase, "nudge");
export const ChevronRightIcon = /*#__PURE__*/ animated(ChevronRightIconBase, "nudge");
export const LogIn = /*#__PURE__*/ animated(LogInBase, "nudge");
export const LogOut = /*#__PURE__*/ animated(LogOutBase, "nudge");
export const MousePointerClick = /*#__PURE__*/ animated(MousePointerClickBase, "nudge");
export const Navigation = /*#__PURE__*/ animated(NavigationBase, "nudge");

export const ArrowUpRight = /*#__PURE__*/ animated(ArrowUpRightBase, "diagonal");
export const ExternalLink = /*#__PURE__*/ animated(ExternalLinkBase, "diagonal");
export const Plane = /*#__PURE__*/ animated(PlaneBase, "diagonal");
export const Rocket = /*#__PURE__*/ animated(RocketBase, "diagonal");
export const Send = /*#__PURE__*/ animated(SendBase, "diagonal");
export const TrendingUp = /*#__PURE__*/ animated(TrendingUpBase, "diagonal");

export const ArrowLeft = /*#__PURE__*/ animated(ArrowLeftBase, "back");
export const ChevronLeft = /*#__PURE__*/ animated(ChevronLeftBase, "back");

export const ArrowUp = /*#__PURE__*/ animated(ArrowUpBase, "up");
export const ChevronUp = /*#__PURE__*/ animated(ChevronUpBase, "up");
export const ImagePlus = /*#__PURE__*/ animated(ImagePlusBase, "up");
export const Sunrise = /*#__PURE__*/ animated(SunriseBase, "up");
export const Upload = /*#__PURE__*/ animated(UploadBase, "up");

export const Archive = /*#__PURE__*/ animated(ArchiveBase, "down");
export const ChevronDown = /*#__PURE__*/ animated(ChevronDownBase, "down");
export const Download = /*#__PURE__*/ animated(DownloadBase, "down");
export const FileDown = /*#__PURE__*/ animated(FileDownBase, "down");
export const Inbox = /*#__PURE__*/ animated(InboxBase, "down");
export const Save = /*#__PURE__*/ animated(SaveBase, "down");

export const Compass = /*#__PURE__*/ animated(CompassBase, "spin");
export const Globe = /*#__PURE__*/ animated(GlobeBase, "spin");
export const Globe2 = /*#__PURE__*/ animated(Globe2Base, "spin");
export const Loader2 = /*#__PURE__*/ animated(Loader2Base, "spin");
export const Radar = /*#__PURE__*/ animated(RadarBase, "spin");
export const RefreshCw = /*#__PURE__*/ animated(RefreshCwBase, "spin");
export const RotateCw = /*#__PURE__*/ animated(RotateCwBase, "spin");
export const Settings = /*#__PURE__*/ animated(SettingsBase, "spin");
export const Settings2 = /*#__PURE__*/ animated(Settings2Base, "spin");
export const Sun = /*#__PURE__*/ animated(SunBase, "spin");
export const Workflow = /*#__PURE__*/ animated(WorkflowBase, "spin");

export const History = /*#__PURE__*/ animated(HistoryBase, "spin-back");
export const RefreshCcw = /*#__PURE__*/ animated(RefreshCcwBase, "spin-back");
export const RotateCcw = /*#__PURE__*/ animated(RotateCcwBase, "spin-back");

export const Ban = /*#__PURE__*/ animated(BanBase, "turn");
export const CircleSlash = /*#__PURE__*/ animated(CircleSlashBase, "turn");
export const Plus = /*#__PURE__*/ animated(PlusBase, "turn");
export const PlusCircle = /*#__PURE__*/ animated(PlusCircleBase, "turn");
export const PlusSquare = /*#__PURE__*/ animated(PlusSquareBase, "turn");
export const X = /*#__PURE__*/ animated(XBase, "turn");
export const XCircle = /*#__PURE__*/ animated(XCircleBase, "turn");
export const XIcon = /*#__PURE__*/ animated(XIconBase, "turn");

export const AlertCircle = /*#__PURE__*/ animated(AlertCircleBase, "ring");
export const AlertTriangle = /*#__PURE__*/ animated(AlertTriangleBase, "ring");
export const Bell = /*#__PURE__*/ animated(BellBase, "ring");
export const BellRing = /*#__PURE__*/ animated(BellRingBase, "ring");
export const Megaphone = /*#__PURE__*/ animated(MegaphoneBase, "ring");
export const MessageCircleWarning = /*#__PURE__*/ animated(MessageCircleWarningBase, "ring");
export const OctagonAlert = /*#__PURE__*/ animated(OctagonAlertBase, "ring");
export const Phone = /*#__PURE__*/ animated(PhoneBase, "ring");
export const ShieldAlert = /*#__PURE__*/ animated(ShieldAlertBase, "ring");
export const TriangleAlert = /*#__PURE__*/ animated(TriangleAlertBase, "ring");

export const BadgeCheck = /*#__PURE__*/ animated(BadgeCheckBase, "pop");
export const BadgePercent = /*#__PURE__*/ animated(BadgePercentBase, "pop");
export const BookOpenCheck = /*#__PURE__*/ animated(BookOpenCheckBase, "pop");
export const Bookmark = /*#__PURE__*/ animated(BookmarkBase, "pop");
export const Cake = /*#__PURE__*/ animated(CakeBase, "pop");
export const Check = /*#__PURE__*/ animated(CheckBase, "pop");
export const CheckCheck = /*#__PURE__*/ animated(CheckCheckBase, "pop");
export const CheckCircle2 = /*#__PURE__*/ animated(CheckCircle2Base, "pop");
export const CheckIcon = /*#__PURE__*/ animated(CheckIconBase, "pop");
export const CircleCheck = /*#__PURE__*/ animated(CircleCheckBase, "pop");
export const Copy = /*#__PURE__*/ animated(CopyBase, "pop");
export const Crown = /*#__PURE__*/ animated(CrownBase, "pop");
export const Flag = /*#__PURE__*/ animated(FlagBase, "pop");
export const Flame = /*#__PURE__*/ animated(FlameBase, "pop");
export const Gift = /*#__PURE__*/ animated(GiftBase, "pop");
export const Lightbulb = /*#__PURE__*/ animated(LightbulbBase, "pop");
export const ListChecks = /*#__PURE__*/ animated(ListChecksBase, "pop");
export const Medal = /*#__PURE__*/ animated(MedalBase, "pop");
export const PartyPopper = /*#__PURE__*/ animated(PartyPopperBase, "pop");
export const PlugZap = /*#__PURE__*/ animated(PlugZapBase, "pop");
export const ShieldCheck = /*#__PURE__*/ animated(ShieldCheckBase, "pop");
export const Sparkles = /*#__PURE__*/ animated(SparklesBase, "pop");
export const Star = /*#__PURE__*/ animated(StarBase, "pop");
export const UserCheck = /*#__PURE__*/ animated(UserCheckBase, "pop");
export const Zap = /*#__PURE__*/ animated(ZapBase, "pop");

export const Bug = /*#__PURE__*/ animated(BugBase, "wiggle");
export const Calculator = /*#__PURE__*/ animated(CalculatorBase, "wiggle");
export const Dumbbell = /*#__PURE__*/ animated(DumbbellBase, "wiggle");
export const Edit2 = /*#__PURE__*/ animated(Edit2Base, "wiggle");
export const Edit3 = /*#__PURE__*/ animated(Edit3Base, "wiggle");
export const Gavel = /*#__PURE__*/ animated(GavelBase, "wiggle");
export const Hammer = /*#__PURE__*/ animated(HammerBase, "wiggle");
export const Palette = /*#__PURE__*/ animated(PaletteBase, "wiggle");
export const Paperclip = /*#__PURE__*/ animated(PaperclipBase, "wiggle");
export const PenTool = /*#__PURE__*/ animated(PenToolBase, "wiggle");
export const Pencil = /*#__PURE__*/ animated(PencilBase, "wiggle");
export const PencilLine = /*#__PURE__*/ animated(PencilLineBase, "wiggle");
export const Scissors = /*#__PURE__*/ animated(ScissorsBase, "wiggle");
export const SquarePen = /*#__PURE__*/ animated(SquarePenBase, "wiggle");
export const Tag = /*#__PURE__*/ animated(TagBase, "wiggle");
export const Trash2 = /*#__PURE__*/ animated(Trash2Base, "wiggle");
export const Type = /*#__PURE__*/ animated(TypeBase, "wiggle");
export const Wrench = /*#__PURE__*/ animated(WrenchBase, "wiggle");

export const Camera = /*#__PURE__*/ animated(CameraBase, "scan");
export const FileSearch = /*#__PURE__*/ animated(FileSearchBase, "scan");
export const Fingerprint = /*#__PURE__*/ animated(FingerprintBase, "scan");
export const LocateFixed = /*#__PURE__*/ animated(LocateFixedBase, "scan");
export const Maximize = /*#__PURE__*/ animated(MaximizeBase, "scan");
export const Minimize = /*#__PURE__*/ animated(MinimizeBase, "scan");
export const MonitorPlay = /*#__PURE__*/ animated(MonitorPlayBase, "scan");
export const QrCode = /*#__PURE__*/ animated(QrCodeBase, "scan");
export const ScanEye = /*#__PURE__*/ animated(ScanEyeBase, "scan");
export const ScanLine = /*#__PURE__*/ animated(ScanLineBase, "scan");
export const ScanSearch = /*#__PURE__*/ animated(ScanSearchBase, "scan");
export const Search = /*#__PURE__*/ animated(SearchBase, "scan");
export const Target = /*#__PURE__*/ animated(TargetBase, "scan");
export const Video = /*#__PURE__*/ animated(VideoBase, "scan");

export const Activity = /*#__PURE__*/ animated(ActivityBase, "beat");
export const CalendarHeart = /*#__PURE__*/ animated(CalendarHeartBase, "beat");
export const HandHeart = /*#__PURE__*/ animated(HandHeartBase, "beat");
export const Headphones = /*#__PURE__*/ animated(HeadphonesBase, "beat");
export const Heart = /*#__PURE__*/ animated(HeartBase, "beat");
export const LifeBuoy = /*#__PURE__*/ animated(LifeBuoyBase, "beat");

export const CircleHelp = /*#__PURE__*/ animated(CircleHelpBase, "blink");
export const Eye = /*#__PURE__*/ animated(EyeBase, "blink");
export const EyeOff = /*#__PURE__*/ animated(EyeOffBase, "blink");
export const HelpCircle = /*#__PURE__*/ animated(HelpCircleBase, "blink");
export const Info = /*#__PURE__*/ animated(InfoBase, "blink");

export const Beer = /*#__PURE__*/ animated(BeerBase, "tilt");
export const Clock = /*#__PURE__*/ animated(ClockBase, "tilt");
export const Clock3 = /*#__PURE__*/ animated(Clock3Base, "tilt");
export const Coffee = /*#__PURE__*/ animated(CoffeeBase, "tilt");
export const Contrast = /*#__PURE__*/ animated(ContrastBase, "tilt");
export const Croissant = /*#__PURE__*/ animated(CroissantBase, "tilt");
export const Droplets = /*#__PURE__*/ animated(DropletsBase, "tilt");
export const Flower2 = /*#__PURE__*/ animated(Flower2Base, "tilt");
export const Hourglass = /*#__PURE__*/ animated(HourglassBase, "tilt");
export const IceCreamCone = /*#__PURE__*/ animated(IceCreamConeBase, "tilt");
export const Languages = /*#__PURE__*/ animated(LanguagesBase, "tilt");
export const Leaf = /*#__PURE__*/ animated(LeafBase, "tilt");
export const Link2 = /*#__PURE__*/ animated(Link2Base, "tilt");
export const LinkIcon = /*#__PURE__*/ animated(LinkIconBase, "tilt");
export const Mail = /*#__PURE__*/ animated(MailBase, "tilt");
export const MessageCircle = /*#__PURE__*/ animated(MessageCircleBase, "tilt");
export const MessageSquare = /*#__PURE__*/ animated(MessageSquareBase, "tilt");
export const MessagesSquare = /*#__PURE__*/ animated(MessagesSquareBase, "tilt");
export const MonitorSmartphone = /*#__PURE__*/ animated(MonitorSmartphoneBase, "tilt");
export const Moon = /*#__PURE__*/ animated(MoonBase, "tilt");
export const MoonStar = /*#__PURE__*/ animated(MoonStarBase, "tilt");
export const PawPrint = /*#__PURE__*/ animated(PawPrintBase, "tilt");
export const Pill = /*#__PURE__*/ animated(PillBase, "tilt");
export const Pizza = /*#__PURE__*/ animated(PizzaBase, "tilt");
export const Printer = /*#__PURE__*/ animated(PrinterBase, "tilt");
export const Quote = /*#__PURE__*/ animated(QuoteBase, "tilt");
export const Share2 = /*#__PURE__*/ animated(Share2Base, "tilt");
export const Smartphone = /*#__PURE__*/ animated(SmartphoneBase, "tilt");

export const Handshake = /*#__PURE__*/ animated(HandshakeBase, "key");
export const KeyRound = /*#__PURE__*/ animated(KeyRoundBase, "key");
export const Keyboard = /*#__PURE__*/ animated(KeyboardBase, "key");
export const Landmark = /*#__PURE__*/ animated(LandmarkBase, "key");
export const Lock = /*#__PURE__*/ animated(LockBase, "key");
export const LockKeyhole = /*#__PURE__*/ animated(LockKeyholeBase, "key");
export const Scale = /*#__PURE__*/ animated(ScaleBase, "key");
export const Shield = /*#__PURE__*/ animated(ShieldBase, "key");
export const Unlock = /*#__PURE__*/ animated(UnlockBase, "key");

export const BarChart3 = /*#__PURE__*/ animated(BarChart3Base, "bars");
export const Code = /*#__PURE__*/ animated(CodeBase, "bars");
export const Cpu = /*#__PURE__*/ animated(CpuBase, "bars");
export const Database = /*#__PURE__*/ animated(DatabaseBase, "bars");
export const FileSpreadsheet = /*#__PURE__*/ animated(FileSpreadsheetBase, "bars");
export const FileText = /*#__PURE__*/ animated(FileTextBase, "bars");
export const GripVertical = /*#__PURE__*/ animated(GripVerticalBase, "bars");
export const Hash = /*#__PURE__*/ animated(HashBase, "bars");
export const Layers = /*#__PURE__*/ animated(LayersBase, "bars");
export const LayoutDashboard = /*#__PURE__*/ animated(LayoutDashboardBase, "bars");
export const LayoutGrid = /*#__PURE__*/ animated(LayoutGridBase, "bars");
export const List = /*#__PURE__*/ animated(ListBase, "bars");
export const Menu = /*#__PURE__*/ animated(MenuBase, "bars");
export const Minus = /*#__PURE__*/ animated(MinusBase, "bars");
export const MoreHorizontal = /*#__PURE__*/ animated(MoreHorizontalBase, "bars");
export const MoreVertical = /*#__PURE__*/ animated(MoreVerticalBase, "bars");
export const Receipt = /*#__PURE__*/ animated(ReceiptBase, "bars");
export const Rss = /*#__PURE__*/ animated(RssBase, "bars");
export const SlidersHorizontal = /*#__PURE__*/ animated(SlidersHorizontalBase, "bars");
export const ToggleLeft = /*#__PURE__*/ animated(ToggleLeftBase, "bars");
export const ToggleRight = /*#__PURE__*/ animated(ToggleRightBase, "bars");

export const BookOpen = /*#__PURE__*/ animated(BookOpenBase, "flip");
export const Calendar = /*#__PURE__*/ animated(CalendarBase, "flip");
export const CalendarDays = /*#__PURE__*/ animated(CalendarDaysBase, "flip");
export const CalendarPlus = /*#__PURE__*/ animated(CalendarPlusBase, "flip");
export const CalendarRange = /*#__PURE__*/ animated(CalendarRangeBase, "flip");
export const CreditCard = /*#__PURE__*/ animated(CreditCardBase, "flip");
export const DollarSign = /*#__PURE__*/ animated(DollarSignBase, "flip");
export const FolderOpen = /*#__PURE__*/ animated(FolderOpenBase, "flip");
export const FolderPlus = /*#__PURE__*/ animated(FolderPlusBase, "flip");
export const Image = /*#__PURE__*/ animated(ImageBase, "flip");
export const ImageOff = /*#__PURE__*/ animated(ImageOffBase, "flip");
export const Map = /*#__PURE__*/ animated(MapBase, "flip");
export const MapPin = /*#__PURE__*/ animated(MapPinBase, "flip");
export const MapPinned = /*#__PURE__*/ animated(MapPinnedBase, "flip");
export const Wallet = /*#__PURE__*/ animated(WalletBase, "flip");

export const Bike = /*#__PURE__*/ animated(BikeBase, "lift");
export const Briefcase = /*#__PURE__*/ animated(BriefcaseBase, "lift");
export const Building2 = /*#__PURE__*/ animated(Building2Base, "lift");
export const Car = /*#__PURE__*/ animated(CarBase, "lift");
export const CloudOff = /*#__PURE__*/ animated(CloudOffBase, "lift");
export const GraduationCap = /*#__PURE__*/ animated(GraduationCapBase, "lift");
export const Home = /*#__PURE__*/ animated(HomeBase, "lift");
export const Package = /*#__PURE__*/ animated(PackageBase, "lift");
export const PackageX = /*#__PURE__*/ animated(PackageXBase, "lift");
export const Pause = /*#__PURE__*/ animated(PauseBase, "lift");
export const Play = /*#__PURE__*/ animated(PlayBase, "lift");
export const Shirt = /*#__PURE__*/ animated(ShirtBase, "lift");
export const ShoppingBag = /*#__PURE__*/ animated(ShoppingBagBase, "lift");
export const ShoppingBasket = /*#__PURE__*/ animated(ShoppingBasketBase, "lift");
export const ShoppingCart = /*#__PURE__*/ animated(ShoppingCartBase, "lift");
export const Store = /*#__PURE__*/ animated(StoreBase, "lift");
export const Truck = /*#__PURE__*/ animated(TruckBase, "lift");
export const User = /*#__PURE__*/ animated(UserBase, "lift");
export const User2 = /*#__PURE__*/ animated(User2Base, "lift");
export const UserCircle2 = /*#__PURE__*/ animated(UserCircle2Base, "lift");
export const UserMinus = /*#__PURE__*/ animated(UserMinusBase, "lift");
export const UserPlus = /*#__PURE__*/ animated(UserPlusBase, "lift");
export const UserRound = /*#__PURE__*/ animated(UserRoundBase, "lift");
export const UserX = /*#__PURE__*/ animated(UserXBase, "lift");
export const Users = /*#__PURE__*/ animated(UsersBase, "lift");
export const UsersRound = /*#__PURE__*/ animated(UsersRoundBase, "lift");
export const UtensilsCrossed = /*#__PURE__*/ animated(UtensilsCrossedBase, "lift");
export const WifiOff = /*#__PURE__*/ animated(WifiOffBase, "lift");
// creado por pato dev y askforvini
