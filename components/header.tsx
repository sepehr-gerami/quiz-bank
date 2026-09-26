import Link from "next/link";
import {
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  UserRound,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { loginAction, logoutAction } from "@/actions/auth";
import {
  MobileNavLinks,
  NavLinks,
  type NavItem,
} from "@/components/site-header";