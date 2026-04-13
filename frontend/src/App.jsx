import { useState, useEffect, useRef } from "react";
import { auth } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const API_BASE = "https://decideforus-backend.onrender.com/api";
const THINKING_STEPS = [
  "Understanding your preferences...",
  "Scanning nearby places...",
  "Checking crowd levels...",
  "Finding best match for you...",
  "Finalizing recommendation...",
];

// CSS written inline to avoid import issues
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --orange: #7c3aed; --orange-light: #a78bfa; --orange-dark: #5b21b6;
    --orange-bg: #f5f3ff; --orange-border: #ede9fe;
    --purple: #7c3aed; --purple-light: #a78bfa; --purple-dark: #5b21b6;
    --purple-bg: #f5f3ff; --purple-border: #ede9fe;
    --white: #ffffff; --gray-50: #fafafa; --gray-100: #f4f4f5;
    --gray-200: #e4e4e7; --gray-400: #a1a1aa; --gray-600: #52525b;
    --gray-700: #3f3f46; --gray-800: #27272a; --gray-900: #18181b;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(124,58,237,0.10), 0 2px 6px rgba(0,0,0,0.06);
    --shadow-lg: 0 12px 40px rgba(124,58,237,0.15), 0 4px 12px rgba(0,0,0,0.08);
    --radius: 16px; --radius-sm: 10px; --radius-xs: 8px;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--gray-50); color: var(--gray-900); min-height: 100vh; -webkit-font-smoothing: antialiased; }
  .navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; height: 68px; background: rgba(255,255,255,0.96); backdrop-filter: blur(16px); border-bottom: 1px solid var(--gray-200); }
  .navbar-logo { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 20px; color: var(--gray-900); cursor: pointer; }
  .navbar-logo-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--orange), var(--orange-light)); display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
  .navbar-logo span { color: var(--orange); }
  .navbar-right { display: flex; align-items: center; gap: 14px; }
  .nav-history-btn { font-size: 14px; font-weight: 600; color: var(--gray-600); background: none; border: 1.5px solid var(--gray-200); cursor: pointer; padding: 8px 16px; border-radius: var(--radius-xs); transition: all 0.15s; }
  .nav-history-btn:hover { color: var(--orange); border-color: var(--orange); background: var(--orange-bg); }
  .nav-user { position: relative; }
  .nav-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--orange), var(--orange-light)); color: white; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid var(--orange-border); overflow: hidden; transition: transform 0.15s; }
  .nav-avatar:hover { transform: scale(1.06); }
  .nav-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .nav-dropdown { position: absolute; top: 52px; right: 0; min-width: 190px; background: white; border-radius: var(--radius-sm); box-shadow: 0 8px 32px rgba(0,0,0,0.14); border: 1px solid var(--gray-200); padding: 8px; animation: dropIn 0.15s ease; }
  @keyframes dropIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .nav-dropdown-name { padding: 10px 12px; font-size: 13px; font-weight: 600; color: var(--gray-600); border-bottom: 1px solid var(--gray-100); margin-bottom: 4px; }
  .nav-dropdown-btn { width: 100%; text-align: left; padding: 9px 12px; background: none; border: none; border-radius: 8px; font-size: 14px; color: var(--gray-800); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.12s; }
  .nav-dropdown-btn:hover { background: var(--gray-100); }
  .nav-dropdown-btn.logout { color: #dc2626; }
  .nav-dropdown-btn.logout:hover { background: #fef2f2; }
  .auth-page { min-height: 100vh; background: linear-gradient(180deg, #faf8ff 0%, #f0ebff 100%); display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; overflow: hidden; }
  .auth-page::before { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%); top: -150px; right: -150px; }
  .auth-card { width: 100%; max-width: 400px; z-index: 1; background: white; border-radius: 24px; padding: 40px 36px; box-shadow: 0 24px 60px rgba(124,58,237,0.15), 0 8px 20px rgba(0,0,0,0.06); animation: fadeUp 0.4s ease; }
  .auth-logo { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-bottom: 32px; }
  .auth-logo-icon { width: 60px; height: 60px; border-radius: 18px; background: linear-gradient(135deg, var(--orange), var(--orange-light)); display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 8px 24px rgba(124,58,237,0.4); }
  .auth-title { font-size: 22px; font-weight: 700; color: var(--gray-900); text-align: center; }
  .auth-subtitle { font-size: 13px; color: var(--gray-400); text-align: center; margin-top: 4px; }
  .auth-label { display: block; font-size: 13px; font-weight: 500; color: var(--gray-600); margin-bottom: 6px; }
  .auth-input { width: 100%; padding: 11px 14px; border: 1.5px solid var(--gray-200); border-radius: var(--radius-xs); font-size: 15px; font-family: 'DM Sans', sans-serif; color: var(--gray-900); background: var(--gray-50); outline: none; transition: all 0.2s; margin-bottom: 14px; }
  .auth-input:focus { border-color: var(--purple); background: white; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  .auth-input::placeholder { color: var(--gray-400); }
  .auth-error { color: #dc2626; font-size: 13px; margin-bottom: 12px; text-align: center; padding: 10px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; }
  .btn-orange { width: 100%; padding: 13px; background: linear-gradient(135deg, var(--purple), var(--purple-dark)); color: white; border: none; border-radius: var(--radius-xs); font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
  .btn-orange:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124,58,237,0.4); }
  .btn-orange:disabled { background: var(--gray-200); color: var(--gray-400); box-shadow: none; cursor: not-allowed; transform: none; }
  .btn-google { width: 100%; padding: 12px; background: white; border: 1.5px solid var(--gray-200); border-radius: var(--radius-xs); font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; color: var(--gray-800); display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; margin-bottom: 16px; }
  .btn-google:hover { border-color: var(--purple); background: var(--purple-bg); box-shadow: var(--shadow-sm); }
  .auth-divider { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--gray-400); margin: 16px 0; }
  .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--gray-200); }
  .auth-switch { font-size: 13px; color: var(--gray-400); text-align: center; margin-top: 16px; }
  .auth-switch button { background: none; border: none; color: var(--purple); font-weight: 600; cursor: pointer; font-size: 13px; padding: 0; font-family: 'DM Sans', sans-serif; }
  .landing-page { min-height: 100vh; padding-top: 68px; background: white; }
  .landing-hero { position: relative; padding: 80px 32px 60px; text-align: center; background: linear-gradient(180deg, #faf8ff 0%, white 100%); overflow: hidden; }
  .landing-hero-bg { position: absolute; inset: 0; z-index: 0; background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 70%); }
  .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--purple-bg); border: 1px solid var(--purple-border); color: var(--purple); font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 999px; margin-bottom: 24px; animation: fadeUp 0.5s ease; position: relative; z-index: 1; }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--orange); animation: pulseDot 2s infinite; }
  @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.5;transform:scale(1.4);} }
  .landing-title { font-size: clamp(36px, 6vw, 64px); font-weight: 800; line-height: 1.1; color: var(--gray-900); margin-bottom: 20px; position: relative; z-index: 1; animation: fadeUp 0.5s ease 0.1s both; }
  .landing-title .highlight { color: var(--orange); }
  .landing-subtitle { font-size: 18px; color: var(--gray-600); max-width: 480px; margin: 0 auto 36px; line-height: 1.6; position: relative; z-index: 1; animation: fadeUp 0.5s ease 0.2s both; }
  .hero-cta-group { display: flex; flex-direction: column; align-items: center; gap: 14px; position: relative; z-index: 1; animation: fadeUp 0.5s ease 0.3s both; }
  .btn-hero { padding: 16px 36px; font-size: 16px; font-weight: 700; background: linear-gradient(135deg, var(--purple), var(--purple-dark)); color: white; border: none; border-radius: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; box-shadow: 0 8px 24px rgba(124,58,237,0.35); transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-hero:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(124,58,237,0.45); }
  .btn-hero:disabled { background: var(--gray-200); color: var(--gray-400); box-shadow: none; cursor: not-allowed; transform: none; }
  .location-note { font-size: 13px; color: var(--gray-400); display: flex; align-items: center; gap: 6px; }
  .location-note.warn { color: #f59e0b; }
  .location-note.ok { color: #34d399; }
  .hero-stats { display: flex; justify-content: center; gap: 48px; padding: 28px 40px; background: var(--purple-bg); border-bottom: 1px solid var(--purple-border); }
  .hero-stat { text-align: center; }
  .hero-stat-num { font-size: 26px; font-weight: 800; color: var(--purple); }
  .hero-stat-label { font-size: 12px; color: var(--gray-600); margin-top: 2px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .landing-features { padding: 80px 40px; max-width: 1060px; margin: 0 auto; }
  .section-tag { display: inline-block; font-size: 12px; font-weight: 700; color: var(--orange); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px; }
  .section-title { font-size: clamp(26px, 4vw, 38px); font-weight: 800; color: var(--gray-900); margin-bottom: 40px; line-height: 1.15; }
  .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 24px; }
  .feature-card { background: white; border: 1.5px solid var(--gray-200); border-radius: var(--radius); padding: 30px 26px; transition: all 0.25s; }
  .feature-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-md); border-color: var(--orange-border); }
  .feature-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--orange-bg); font-size: 22px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid var(--orange-border); }
  .feature-title { font-size: 16px; font-weight: 700; color: var(--gray-900); margin-bottom: 8px; }
  .feature-desc { font-size: 14px; color: var(--gray-600); line-height: 1.6; }
  .why-section { padding: 80px 40px; background: var(--gray-50); position: relative; overflow: hidden; }
  .why-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 70% at 30% 50%, rgba(124,58,237,0.04) 0%, transparent 70%); }
  .why-inner { max-width: 1060px; margin: 0 auto; position: relative; z-index: 1; }
  .why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
  .why-content .section-title { color: var(--gray-900); }
  .why-list { display: flex; flex-direction: column; gap: 20px; margin-top: 8px; }
  .why-item { display: flex; gap: 16px; align-items: flex-start; }
  .why-item-icon { width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0; background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .why-item-title { font-weight: 700; color: var(--gray-900); font-size: 15px; margin-bottom: 4px; }
  .why-item-desc { font-size: 14px; color: var(--gray-600); line-height: 1.5; }
  .why-visual { background: white; border-radius: 24px; border: 1px solid var(--gray-200); padding: 32px; display: flex; flex-direction: column; gap: 16px; box-shadow: var(--shadow-lg); }
  .why-visual-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .why-visual-logo { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--orange), var(--orange-light)); display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .why-visual-name { font-weight: 800; color: var(--gray-900); font-size: 18px; }
  .why-visual-sub { font-size: 13px; color: var(--gray-400); }
  .mock-question { background: var(--gray-50); border-radius: 12px; padding: 14px 16px; border: 1px solid var(--gray-200); }
  .mock-q-label { font-size: 12px; color: var(--gray-400); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.8px; }
  .mock-options { display: flex; gap: 8px; flex-wrap: wrap; }
  .mock-opt { padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; background: var(--gray-100); color: var(--gray-600); }
  .mock-opt.active { background: var(--orange); color: white; }
  .mock-result { background: var(--purple-bg); border: 1px solid var(--purple-border); border-radius: 12px; padding: 16px; display: flex; gap: 12px; align-items: center; }
  .mock-result-icon { font-size: 28px; }
  .mock-result-name { font-weight: 700; color: var(--gray-900); font-size: 15px; }
  .mock-result-sub { font-size: 13px; color: var(--gray-600); }
  .landing-steps { padding: 80px 40px; background: var(--gray-50); }
  .steps-inner { max-width: 1060px; margin: 0 auto; }
  .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0; }
  .step-item { text-align: center; padding: 0 24px; position: relative; }
  .step-item:not(:last-child)::after { content: "→"; position: absolute; right: -12px; top: 20px; color: var(--orange); font-size: 20px; font-weight: 700; }
  .step-num { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--purple), var(--purple-dark)); color: white; font-size: 20px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 6px 16px rgba(124,58,237,0.35); }
  .step-label { font-size: 15px; font-weight: 700; color: var(--gray-900); margin-bottom: 8px; }
  .step-desc { font-size: 14px; color: var(--gray-600); line-height: 1.5; }
  .testimonials-section { padding: 80px 40px; background: white; }
  .testimonials-inner { max-width: 1060px; margin: 0 auto; }
  .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 48px; }
  .testimonial-card { background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: var(--radius); padding: 28px 24px; transition: all 0.2s; }
  .testimonial-card:hover { border-color: var(--orange-border); box-shadow: var(--shadow-sm); }
  .testimonial-stars { font-size: 14px; color: #f59e0b; margin-bottom: 12px; letter-spacing: 2px; }
  .testimonial-text { font-size: 15px; color: var(--gray-700); line-height: 1.65; margin-bottom: 16px; font-style: italic; }
  .testimonial-author { display: flex; align-items: center; gap: 10px; }
  .testimonial-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--orange), var(--orange-light)); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: white; }
  .testimonial-name { font-weight: 700; font-size: 14px; color: var(--gray-900); }
  .testimonial-city { font-size: 12px; color: var(--gray-400); }
  .cta-banner { margin: 0 40px 80px; border-radius: 24px; background: linear-gradient(135deg, var(--purple), var(--purple-dark)); border: none; padding: 60px 48px; text-align: center; position: relative; overflow: hidden; }
  .cta-banner::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 80% at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%); }
  .cta-banner h2 { font-size: clamp(24px, 4vw, 38px); font-weight: 800; color: white; margin-bottom: 14px; position: relative; z-index: 1; line-height: 1.15; }
  .cta-banner p { font-size: 16px; color: rgba(255,255,255,0.5); margin-bottom: 32px; position: relative; z-index: 1; }
  .cta-banner .btn-hero { position: relative; z-index: 1; display: inline-flex; }
  .site-footer { background: var(--gray-900); border-top: 1px solid rgba(255,255,255,0.08); padding: 56px 40px 32px; }
  .footer-inner { max-width: 1060px; margin: 0 auto; }
  .footer-top { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .footer-brand .footer-logo { font-size: 20px; font-weight: 800; color: white; display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .footer-logo-icon { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg, var(--orange), var(--orange-light)); display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .footer-brand p { font-size: 14px; color: rgba(255,255,255,0.4); line-height: 1.7; }
  .footer-col-title { font-size: 14px; font-weight: 700; color: white; margin-bottom: 16px; }
  .footer-links { display: flex; flex-direction: column; gap: 10px; }
  .footer-links a { font-size: 14px; color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.15s; cursor: pointer; }
  .footer-links a:hover { color: var(--orange); }
  .footer-bottom { padding-top: 28px; display: flex; align-items: center; justify-content: space-between; }
  .footer-bottom p { font-size: 13px; color: rgba(255,255,255,0.25); }
  .footer-socials { display: flex; gap: 12px; }
  .footer-social-btn { width: 36px; height: 36px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; transition: all 0.15s; color: rgba(255,255,255,0.5); }
  .footer-social-btn:hover { background: rgba(124,58,237,0.15); border-color: rgba(124,58,237,0.3); color: var(--orange); }
  .q-page { min-height: 100vh; padding: 88px 20px 40px; background: #0A0A0A; display: flex; flex-direction: column; align-items: center; }
  .q-top { width: 100%; max-width: 580px; display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
  .q-back { width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; color: rgba(255,255,255,0.6); transition: all 0.15s; flex-shrink: 0; }
  .q-back:hover { border-color: var(--orange); color: var(--orange); background: rgba(124,58,237,0.1); }
  .q-progress-wrap { flex: 1; }
  .q-progress-label { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 8px; font-weight: 600; }
  .q-progress-bar { height: 5px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; }
  .q-progress-fill { height: 100%; background: linear-gradient(90deg, var(--orange), var(--orange-light)); border-radius: 99px; transition: width 0.4s ease; }
  .q-restart { font-size: 18px; color: rgba(255,255,255,0.3); background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
  .q-restart:hover { color: var(--orange); }
  .q-card { width: 100%; max-width: 580px; background: #161616; border-radius: 24px; padding: 40px 36px; box-shadow: 0 24px 64px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); animation: fadeUp 0.3s ease; }
  .q-icon { width: 54px; height: 54px; border-radius: 14px; background: rgba(124,58,237,0.12); font-size: 26px; display: flex; align-items: center; justify-content: center; margin-bottom: 22px; border: 1px solid rgba(124,58,237,0.2); }
  .q-card h2 { font-size: 26px; font-weight: 800; color: white; margin-bottom: 8px; line-height: 1.2; }
  .q-sub { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 30px; }
  .q-options { display: flex; flex-direction: column; gap: 10px; }
  .q-option { width: 100%; padding: 16px 20px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 14px; font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.75); cursor: pointer; text-align: left; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 14px; transition: all 0.18s; }
  .q-option:hover { border-color: var(--orange); color: white; background: rgba(124,58,237,0.1); transform: translateX(6px); box-shadow: 0 4px 16px rgba(124,58,237,0.15); }
  .q-option-emoji { font-size: 22px; flex-shrink: 0; }
  .thinking-page { min-height: 100vh; padding-top: 68px; background: #0A0A0A; display: flex; align-items: center; justify-content: center; }
  .thinking-card { width: 100%; max-width: 460px; margin: 20px; background: #161616; border-radius: 24px; padding: 52px 44px; text-align: center; box-shadow: 0 24px 80px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); animation: fadeUp 0.3s ease; }
  .thinking-spinner { width: 80px; height: 80px; margin: 0 auto 28px; border-radius: 50%; background: linear-gradient(135deg, var(--orange), var(--orange-light)); display: flex; align-items: center; justify-content: center; font-size: 36px; animation: pulse 1.5s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(124,58,237,0.4);}50%{transform:scale(1.05);box-shadow:0 0 0 20px rgba(124,58,237,0);} }
  .thinking-card h2 { font-size: 24px; font-weight: 800; color: white; margin-bottom: 12px; }
  .thinking-step { font-size: 15px; color: #a78bfa; font-weight: 500; min-height: 24px; transition: all 0.3s; }
  .dot-loader { display: flex; gap: 8px; justify-content: center; margin-top: 24px; }
  .dot-loader span { width: 8px; height: 8px; border-radius: 50%; background: rgba(124,58,237,0.4); animation: blink 1.4s infinite both; }
  .dot-loader span:nth-child(2) { animation-delay: 0.2s; }
  .dot-loader span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink { 0%,100%{opacity:0.2;transform:scale(0.8);}50%{opacity:1;transform:scale(1);background:var(--orange);} }
  .result-page { min-height: 100vh; padding: 88px 20px 48px; background: #0A0A0A; display: flex; align-items: center; justify-content: center; }
  .result-card { width: 100%; max-width: 560px; background: #161616; border-radius: 24px; padding: 44px 40px; text-align: center; box-shadow: 0 24px 80px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); animation: fadeUp 0.4s ease; }
  .result-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.25); color: #34d399; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 999px; margin-bottom: 22px; }
  .result-card h2 { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.35); margin-bottom: 8px; letter-spacing: 1.5px; text-transform: uppercase; }
  .result-name { font-size: 32px; font-weight: 800; color: white; margin-bottom: 16px; line-height: 1.15; }
  .result-reason { font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.65; padding: 18px 20px; background: rgba(255,255,255,0.04); border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 20px; text-align: left; }
  .result-tags { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 28px; }
  .result-tag { padding: 5px 14px; background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2); border-radius: 999px; font-size: 13px; color: #a78bfa; font-weight: 600; }
  .result-actions { display: flex; flex-direction: column; gap: 10px; }
  .btn-maps { width: 100%; padding: 15px; background: linear-gradient(135deg, #1a73e8, #1557b0); color: white; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 16px rgba(26,115,232,0.35); transition: all 0.2s; }
  .btn-maps:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,115,232,0.5); }
  .btn-whatsapp { width: 100%; padding: 14px; background: linear-gradient(135deg, #25D366, #1da851); color: white; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 14px rgba(37,211,102,0.3); transition: all 0.2s; }
  .btn-whatsapp:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(37,211,102,0.45); }
  .btn-restart { width: 100%; padding: 14px; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); border-radius: 14px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
  .btn-restart:hover { border-color: var(--orange); color: var(--orange); background: rgba(124,58,237,0.08); }
  .history-page { min-height: 100vh; padding: 88px 20px 48px; background: #0A0A0A; }
  .history-inner { max-width: 760px; margin: 0 auto; padding-top: 32px; }
  .history-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
  .history-header h1 { font-size: 28px; font-weight: 800; color: white; }
  .history-header p { font-size: 14px; color: rgba(255,255,255,0.35); margin-top: 4px; }
  .btn-orange-sm { padding: 10px 20px; background: linear-gradient(135deg, var(--purple), var(--purple-dark)); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; box-shadow: 0 4px 12px rgba(124,58,237,0.25); }
  .btn-orange-sm:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.45); }
  .history-empty { text-align: center; padding: 80px 40px; background: #161616; border-radius: var(--radius); border: 1.5px dashed rgba(255,255,255,0.1); }
  .history-empty-icon { font-size: 56px; margin-bottom: 18px; }
  .history-empty h3 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 10px; }
  .history-empty p { font-size: 15px; color: rgba(255,255,255,0.35); margin-bottom: 28px; }
  .history-list { display: flex; flex-direction: column; gap: 14px; }
  .history-item { background: #161616; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 22px 24px; display: flex; gap: 16px; align-items: flex-start; transition: all 0.2s; }
  .history-item:hover { border-color: rgba(124,58,237,0.25); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
  .history-item-icon { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; background: linear-gradient(135deg, var(--orange), var(--orange-light)); display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .history-item-body { flex: 1; }
  .history-item-name { font-size: 17px; font-weight: 700; color: white; margin-bottom: 4px; }
  .history-item-reason { font-size: 13px; color: rgba(255,255,255,0.45); margin-bottom: 10px; line-height: 1.5; }
  .history-item-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .history-item-tag { padding: 3px 10px; background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2); border-radius: 999px; font-size: 12px; color: #a78bfa; font-weight: 600; }
  .history-item-date { font-size: 12px; color: rgba(255,255,255,0.2); margin-top: 8px; }
  .history-item-maps { padding: 8px 14px; background: rgba(26,115,232,0.12); border: 1px solid rgba(26,115,232,0.25); border-radius: 8px; font-size: 13px; font-weight: 600; color: #60a5fa; cursor: pointer; transition: all 0.15s; white-space: nowrap; font-family: 'DM Sans', sans-serif; }
  .history-item-maps:hover { background: rgba(26,115,232,0.2); }
  .loc-banner { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); z-index: 200; width: calc(100% - 40px); max-width: 500px; background: #1A1A1A; border-radius: var(--radius); box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); padding: 22px 26px; display: flex; align-items: flex-start; gap: 16px; animation: slideUp 0.4s ease; }
  @keyframes slideUp { from{transform:translateX(-50%) translateY(24px);opacity:0;}to{transform:translateX(-50%) translateY(0);opacity:1;} }
  .loc-banner-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(124,58,237,0.12); border: 1px solid rgba(124,58,237,0.2); font-size: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .loc-banner-body { flex: 1; }
  .loc-banner-title { font-size: 15px; font-weight: 700; color: white; margin-bottom: 4px; }
  .loc-banner-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 14px; line-height: 1.5; }
  .loc-banner-btns { display: flex; gap: 10px; }
  .loc-btn-allow { padding: 9px 20px; background: var(--orange); color: white; border: none; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .loc-btn-allow:hover { background: var(--orange-dark); transform: translateY(-1px); }
  .loc-btn-skip { padding: 9px 16px; background: none; border: 1.5px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.5); border-radius: 9px; font-size: 13px; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
  .loc-btn-skip:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.8); }
  .loc-banner-close { background: none; border: none; cursor: pointer; font-size: 18px; color: rgba(255,255,255,0.3); padding: 0; width: 24px; flex-shrink: 0; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);} }
  @media (max-width: 768px) { .navbar{padding:0 20px;} .why-grid{grid-template-columns:1fr;gap:36px;} .footer-top{grid-template-columns:1fr 1fr;gap:32px;} .hero-stats{gap:24px;padding:24px 20px;} .step-item:not(:last-child)::after{display:none;} .cta-banner{margin:0 16px 48px;padding:40px 28px;} }
  @media (max-width: 640px) { .q-card{padding:28px 22px;} .result-card{padding:30px 22px;} .auth-card{padding:36px 26px;} .landing-hero{padding:70px 20px 60px;} .landing-features,.why-section,.landing-steps,.testimonials-section{padding:56px 20px;} .footer-top{grid-template-columns:1fr;gap:28px;} .footer-bottom{flex-direction:column;gap:16px;text-align:center;} }
`;

function LocationBanner({ onAllow, onSkip, onDismiss }) {
  return (
    <div className="loc-banner">
      <div className="loc-banner-icon">📍</div>
      <div className="loc-banner-body">
        <div className="loc-banner-title">Enable Location for Better Results</div>
        <div className="loc-banner-sub">We will find the best restaurants near you. Your location is never stored or shared.</div>
        <div className="loc-banner-btns">
          <button className="loc-btn-allow" onClick={onAllow}>Allow Location</button>
          <button className="loc-btn-skip" onClick={onSkip}>Skip for now</button>
        </div>
      </div>
      <button className="loc-banner-close" onClick={onDismiss}>x</button>
    </div>
  );
}

function Navbar({ user, onLogout, onHistory, onDashboard, screen }) {
  const [showMenu, setShowMenu] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={onDashboard}>
        <div className="navbar-logo-icon">🍽️</div>
        Pick<span>si</span>
      </div>
      <div className="navbar-right">
        {user && (
          <>
            {screen !== "history" && (<button className="nav-history-btn" onClick={onHistory}>View History</button>)}
            <div className="nav-user" ref={ref}>
              <div className="nav-avatar" onClick={() => setShowMenu(v => !v)}>
                {user.photoURL ? <img src={user.photoURL} alt="user" /> : <span>{user.email[0].toUpperCase()}</span>}
              </div>
              {showMenu && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-name">{user.displayName || user.email}</div>
                  <button className="nav-dropdown-btn" onClick={() => { setShowMenu(false); onDashboard(); }}>🏠 Dashboard</button>
                  <button className="nav-dropdown-btn logout" onClick={() => { setShowMenu(false); onLogout(); }}>→ Logout</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

function QuestionCard({ step, total, icon, title, sub, options, onBack, onRestart, progress }) {
  return (
    <div className="q-page">
      <div className="q-top">
        <button className="q-back" onClick={onBack}>←</button>
        <div className="q-progress-wrap">
          <div className="q-progress-label"><span>Step {step} of {total}</span><span>{Math.round(progress)}%</span></div>
          <div className="q-progress-bar"><div className="q-progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
        <button className="q-restart" onClick={onRestart} title="Restart">↺</button>
      </div>
      <div className="q-card">
        <div className="q-icon">{icon}</div>
        <h2>{title}</h2>
        <p className="q-sub">{sub}</p>
        <div className="q-options">
          {options.map((opt) => (
            <button key={opt.value} className="q-option" onClick={() => opt.onClick()}>
              <span className="q-option-emoji">{opt.emoji}</span>{opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ item }) {
  const openMaps = () => {
    const query = encodeURIComponent(item.name + " restaurant");
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };
  return (
    <div className="history-item">
      <div className="history-item-icon">🍽️</div>
      <div className="history-item-body">
        <div className="history-item-name">{item.name}</div>
        <div className="history-item-reason">{item.reason}</div>
        <div className="history-item-tags">
          {[item.goingWith, item.time, item.mood, item.foodType, item.budget].filter(Boolean).map(tag => (
            <span key={tag} className="history-item-tag">{tag}</span>
          ))}
        </div>
        <div className="history-item-date">{new Date(item.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
      </div>
      <button className="history-item-maps" onClick={openMaps}>📍 Maps</button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationStatus, setLocationStatus] = useState("idle");
  const [showLocBanner, setShowLocBanner] = useState(false);
  const [goingWith, setGoingWith] = useState("");
  const [time, setTime] = useState("");
  const [mood, setMood] = useState("");
  const [foodType, setFoodType] = useState("");
  const [budget, setBudget] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
      if (u) {
        const saved = localStorage.getItem(`picksi_history_${u.uid}`);
        if (saved) { try { setHistory(JSON.parse(saved)); } catch {} }
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (screen === "landing" && user && locationStatus === "idle") {
      const timer = setTimeout(() => setShowLocBanner(true), 900);
      return () => clearTimeout(timer);
    }
  }, [screen, user, locationStatus]);

  const requestLocation = () => {
    setShowLocBanner(false);
    if (!navigator.geolocation) { setLocationStatus("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationStatus("granted"); },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const skipLocation = () => { setShowLocBanner(false); setLocationStatus("skipped"); };

  const handleGoogleLogin = async () => {
    setAuthError("");
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (err) { setAuthError(err.message.replace("Firebase: ", "").replace(/\(auth.*\)/, "").trim()); }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) { setAuthError("Please enter your email and password."); return; }
    if (authMode === "signup" && password.length < 6) { setAuthError("Password must be at least 6 characters."); return; }
    setAuthError(""); setAuthLoading(true);
    try {
      if (authMode === "signup") { await createUserWithEmailAndPassword(auth, email, password); }
      else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (err) {
      const msg = err.code === "auth/user-not-found" ? "No account found with this email."
        : err.code === "auth/wrong-password" ? "Incorrect password. Please try again."
        : err.code === "auth/email-already-in-use" ? "An account already exists with this email."
        : err.code === "auth/invalid-email" ? "Please enter a valid email address."
        : err.code === "auth/invalid-credential" ? "Invalid email or password."
        : err.message.replace("Firebase: ", "").trim();
      setAuthError(msg);
    } finally { setAuthLoading(false); }
  };

  const handleLogout = async () => { await signOut(auth); setScreen("landing"); setLocationStatus("idle"); setHistory([]); };

  const saveToHistory = (rec) => {
    if (!user || !rec) return;
    const entry = { id: Date.now(), name: rec.name, reason: rec.reason, goingWith, time, mood, foodType, budget, timestamp: Date.now() };
    const updated = [entry, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem(`picksi_history_${user.uid}`, JSON.stringify(updated));
  };

  useEffect(() => {
    if (screen !== "thinking") return;
    setThinkingIndex(0);
    const interval = setInterval(() => { setThinkingIndex(p => p < THINKING_STEPS.length - 1 ? p + 1 : p); }, 700);
    const timer = setTimeout(async () => {
      clearInterval(interval);
      const rec = await fetchRecommendation();
      saveToHistory(rec);
      setScreen("result");
    }, 3800);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [screen]);

  const fetchRecommendation = async () => {
    if (!location.lat) {
      const fallback = { name: "A Popular Nearby Restaurant", reason: "Based on your preferences, this is a top-rated spot loved by locals in your area." };
      setRecommendation(fallback); return fallback;
    }
    try {
      const res = await fetch(`${API_BASE}/recommend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mood, goingWith, budget, time, foodType, location }) });
      const data = await res.json(); setRecommendation(data); return data;
    } catch {
      const fallback = { name: "A Popular Nearby Restaurant", reason: "A reliable and highly-rated spot near you, perfect for your preferences." };
      setRecommendation(fallback); return fallback;
    }
  };

  const restartFlow = () => { setGoingWith(""); setTime(""); setMood(""); setFoodType(""); setBudget(""); setRecommendation(null); setScreen("landing"); };
  const goBack = () => { const map = { q1: "landing", q2: "q1", q3: "q2", q4: "q3", q5: "q4" }; setScreen(map[screen] || "landing"); };

  const openMaps = () => {
    if (!recommendation?.name) return;
    const query = encodeURIComponent(recommendation.name + " restaurant");
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const shareOnWhatsApp = () => {
    if (!recommendation?.name) return;
    const msg = `🍽️ *Picksi decided for us!*\n\n📍 *${recommendation.name}*\n💡 ${recommendation.reason}\n\n✨ Try it yourself → https://picksi.app/`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loadingAuth) return (
    <><style>{css}</style>
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0A0A0A" }}>
      <div className="thinking-spinner" style={{ width:60, height:60, fontSize:26 }}>🍽️</div>
    </div></>
  );

  if (!user) return (
    <><style>{css}</style>
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🍽️</div>
          <div>
            <div className="auth-title">Welcome to Picksi</div>
            <div className="auth-subtitle">{authMode === "login" ? "Sign in to find your perfect restaurant" : "Create your account to get started"}</div>
          </div>
        </div>
        <button className="btn-google" onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg>
          Continue with Google
        </button>
        <div className="auth-divider">OR</div>
        {authError && <div className="auth-error">{authError}</div>}
        <label className="auth-label">Email</label>
        <input type="email" className="auth-input" placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); setAuthError(""); }} />
        <label className="auth-label">Password</label>
        <input type="password" className="auth-input" placeholder={authMode === "signup" ? "Min. 6 characters" : "••••••••"} value={password} onChange={e => { setPassword(e.target.value); setAuthError(""); }} onKeyDown={e => e.key === "Enter" && handleEmailAuth()} />
        <button className="btn-orange" onClick={handleEmailAuth} disabled={authLoading}>{authLoading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}</button>
        <p className="auth-switch">
          {authMode === "login"
            ? <>Don't have an account? <button onClick={() => { setAuthMode("signup"); setAuthError(""); }}>Sign up free</button></>
            : <>Already have an account? <button onClick={() => { setAuthMode("login"); setAuthError(""); }}>Sign in</button></>}
        </p>
      </div>
    </div></>
  );

  if (screen === "landing") return (
    <><style>{css}</style>
    <Navbar user={user} onLogout={handleLogout} onHistory={() => setScreen("history")} onDashboard={() => setScreen("landing")} screen={screen} />
    <div className="landing-page">
      <div className="landing-hero">
        <div className="landing-hero-bg" />
        <div className="hero-badge"><span className="badge-dot" />AI-Powered Restaurant Decisions</div>
        <h1 className="landing-title">Stop Overthinking.<br />Let <span className="highlight">Picksi</span> Decide.</h1>
        <p className="landing-subtitle">Answer 5 quick questions and get an AI-picked restaurant near you — tailored to your mood, budget, and company.</p>
        <div className="hero-cta-group">
          <button className="btn-hero" onClick={() => setScreen("q1")} disabled={locationStatus === "idle"}>🍽️ Find My Restaurant</button>
          {locationStatus === "idle" && <span className="location-note warn">⚠️ Allow location first to continue</span>}
          {locationStatus === "granted" && <span className="location-note ok">✅ Location detected — ready to go!</span>}
          {(locationStatus === "denied" || locationStatus === "skipped") && <button className="btn-hero" onClick={() => setScreen("q1")} style={{ marginTop: 4 }}>🍽️ Continue Without Location</button>}
        </div>
      </div>
      <div className="hero-stats">
        <div className="hero-stat"><div className="hero-stat-num">10K+</div><div className="hero-stat-label">Decisions Made</div></div>
        <div className="hero-stat"><div className="hero-stat-num">5s</div><div className="hero-stat-label">Avg. Decision Time</div></div>
        <div className="hero-stat"><div className="hero-stat-num">98%</div><div className="hero-stat-label">Satisfaction Rate</div></div>
        <div className="hero-stat"><div className="hero-stat-num">50+</div><div className="hero-stat-label">Cities</div></div>
      </div>
      <div className="landing-features">
        <div className="section-tag">WHY PICKSI</div>
        <div className="section-title">Smart decisions, every time.</div>
        <div className="features-grid">
          {[
            { icon: "🧠", title: "Smart AI Engine", desc: "Learns your mood, budget, and company to surface the perfect match." },
            { icon: "📍", title: "Hyper-Local Results", desc: "Uses your real-time location to find nearby, open restaurants instantly." },
            { icon: "⚡", title: "5-Second Answer", desc: "No scrolling through reviews. One confident recommendation in seconds." },
            { icon: "🔒", title: "100% Private", desc: "We never store your location or personal data. Your privacy is sacred." },
          ].map(f => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="why-section">
        <div className="why-inner">
          <div className="why-grid">
            <div className="why-content">
              <div className="section-tag" style={{color:'#a78bfa'}}>THE PICKSI DIFFERENCE</div>
              <div className="section-title">Why people love Picksi</div>
              <div className="why-list">
                {[
                  { icon: "🎯", title: "Zero Decision Fatigue", desc: "Stop arguing about where to eat. Picksi ends the debate instantly." },
                  { icon: "🗺️", title: "Google Maps Integration", desc: "Every recommendation links directly to Maps for easy directions." },
                  { icon: "💬", title: "Share with Your Group", desc: "One tap to share your pick on WhatsApp — no more group debates." },
                  { icon: "📜", title: "Decision History", desc: "Review all your past picks and revisit your favourite spots." },
                ].map(item => (
                  <div className="why-item" key={item.title}>
                    <div className="why-item-icon">{item.icon}</div>
                    <div><div className="why-item-title">{item.title}</div><div className="why-item-desc">{item.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="why-visual">
              <div className="why-visual-header">
                <div className="why-visual-logo">🍽️</div>
                <div><div className="why-visual-name">Picksi</div><div className="why-visual-sub">AI Food Decider</div></div>
              </div>
              <div className="mock-question">
                <div className="mock-q-label">Who are you going with?</div>
                <div className="mock-options"><span className="mock-opt active">❤️ Date</span><span className="mock-opt">👯 Friends</span><span className="mock-opt">👨‍👩‍👧 Family</span></div>
              </div>
              <div className="mock-question">
                <div className="mock-q-label">What's the vibe?</div>
                <div className="mock-options"><span className="mock-opt">😌 Casual</span><span className="mock-opt active">🕯️ Romantic</span><span className="mock-opt">🎉 Lively</span></div>
              </div>
              <div className="mock-result">
                <div className="mock-result-icon">🍷</div>
                <div><div className="mock-result-name">The Candlelight Bistro</div><div className="mock-result-sub">Perfect romantic dinner spot near you</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="landing-steps">
        <div className="steps-inner">
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div className="section-tag">HOW IT WORKS</div>
            <div className="section-title">From hungry to happy in 4 steps</div>
          </div>
          <div className="steps-grid">
            {[
              { n:1, label:"Allow Location", desc:"So we know where to look for the best options" },
              { n:2, label:"Answer 5 Questions", desc:"Mood, company, budget — all in under a minute" },
              { n:3, label:"AI Thinks", desc:"Our engine picks the perfect match for you" },
              { n:4, label:"Go Eat!", desc:"Open in Maps, share on WhatsApp, and enjoy" },
            ].map(s => (
              <div className="step-item" key={s.n}>
                <div className="step-num">{s.n}</div>
                <div className="step-label">{s.label}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="testimonials-section">
        <div className="testimonials-inner">
          <div className="section-tag">WHAT PEOPLE SAY</div>
          <div className="section-title">Loved by food lovers everywhere</div>
          <div className="testimonials-grid">
            {[
              { initials:"R", name:"Rahul M.", city:"Mumbai", stars:"★★★★★", text:"My friends and I used to spend 30 mins deciding where to eat. Picksi settled it in 5 seconds. Game changer!" },
              { initials:"P", name:"Priya S.", city:"Bengaluru", stars:"★★★★★", text:"Took my girlfriend on a date to a restaurant Picksi recommended. She loved it! The romantic filter is spot on." },
              { initials:"A", name:"Arjun K.", city:"Delhi", stars:"★★★★★", text:"Finally an app that does not overwhelm you with 500 options. Just tells you where to go. Perfect." },
            ].map(t => (
              <div className="testimonial-card" key={t.name}>
                <div className="testimonial-stars">{t.stars}</div>
                <div className="testimonial-text">"{t.text}"</div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div><div className="testimonial-name">{t.name}</div><div className="testimonial-city">{t.city}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="cta-banner">
        <h2>Ready to stop overthinking?<br />Let Picksi decide.</h2>
        <p>Join thousands of food lovers who never argue about restaurants again.</p>
        <button className="btn-hero" onClick={() => setScreen("q1")} disabled={locationStatus === "idle"}>🍽️ Find My Restaurant Now</button>
      </div>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo"><div className="footer-logo-icon">🍽️</div>Picksi</div>
              <p>AI-powered restaurant decisions tailored to your mood, budget, and company. Stop overthinking — start eating.</p>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              <div className="footer-links"><a onClick={() => setScreen("q1")}>Find a Restaurant</a><a onClick={() => setScreen("history")}>My History</a><a>How It Works</a></div>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <div className="footer-links"><a>About Us</a><a>Privacy Policy</a><a>Terms of Service</a></div>
            </div>
            <div>
              <div className="footer-col-title">Connect</div>
              <div className="footer-links"><a>Instagram</a><a>Twitter / X</a><a>Contact Us</a></div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 Picksi. All rights reserved.</p>
            <div className="footer-socials">
              <button className="footer-social-btn">📸</button>
              <button className="footer-social-btn">🐦</button>
              <button className="footer-social-btn">💬</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
    {showLocBanner && <LocationBanner onAllow={requestLocation} onSkip={skipLocation} onDismiss={() => setShowLocBanner(false)} />}
    </>
  );

  if (screen === "history") return (
    <><style>{css}</style>
    <Navbar user={user} onLogout={handleLogout} onHistory={() => setScreen("history")} onDashboard={() => setScreen("landing")} screen={screen} />
    <div className="history-page">
      <div className="history-inner">
        <div className="history-header">
          <div>
            <h1>Your History</h1>
            <p>{history.length > 0 ? `${history.length} decision${history.length > 1 ? "s" : ""} made` : "Every decision, perfectly solved."}</p>
          </div>
          <button className="btn-orange-sm" onClick={() => setScreen("q1")}>+ New Pick</button>
        </div>
        {history.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">🍽️</div>
            <h3>No decisions yet!</h3>
            <p>Let the AI pick your first restaurant. It only takes 30 seconds.</p>
            <button className="btn-orange-sm" onClick={() => setScreen("q1")}>Start First Decision</button>
          </div>
        ) : (
          <div className="history-list">{history.map(item => <HistoryItem key={item.id} item={item} />)}</div>
        )}
      </div>
    </div></>
  );

  const qProps = { onBack: goBack, onRestart: restartFlow };

  if (screen === "q1") return (<><style>{css}</style><Navbar user={user} onLogout={handleLogout} onHistory={() => setScreen("history")} onDashboard={() => setScreen("landing")} screen={screen} /><QuestionCard {...qProps} step={1} total={5} progress={20} icon="👥" title="Who are you going with?" sub="Help us understand your plan better" options={[{emoji:"👯",label:"Friends",value:"friends",onClick:()=>{setGoingWith("friends");setScreen("q2");}},{emoji:"❤️",label:"Girlfriend / Date",value:"date",onClick:()=>{setGoingWith("date");setScreen("q2");}},{emoji:"👨‍👩‍👧",label:"Sister / Family",value:"family",onClick:()=>{setGoingWith("family");setScreen("q2");}},{emoji:"💼",label:"Office Team",value:"office",onClick:()=>{setGoingWith("office");setScreen("q2");}},{emoji:"🧍",label:"Solo",value:"solo",onClick:()=>{setGoingWith("solo");setScreen("q2");}}]} /></>);

  if (screen === "q2") return (<><style>{css}</style><Navbar user={user} onLogout={handleLogout} onHistory={() => setScreen("history")} onDashboard={() => setScreen("landing")} screen={screen} /><QuestionCard {...qProps} step={2} total={5} progress={40} icon="🕐" title="When is the plan?" sub="Choose your meal time" options={[{emoji:"☀️",label:"Breakfast",value:"breakfast",onClick:()=>{setTime("breakfast");setScreen("q3");}},{emoji:"🍱",label:"Lunch",value:"lunch",onClick:()=>{setTime("lunch");setScreen("q3");}},{emoji:"☕",label:"Evening Snacks",value:"evening",onClick:()=>{setTime("evening");setScreen("q3");}},{emoji:"🌙",label:"Dinner",value:"dinner",onClick:()=>{setTime("dinner");setScreen("q3");}}]} /></>);

  if (screen === "q3") return (<><style>{css}</style><Navbar user={user} onLogout={handleLogout} onHistory={() => setScreen("history")} onDashboard={() => setScreen("landing")} screen={screen} /><QuestionCard {...qProps} step={3} total={5} progress={60} icon="✨" title="What's the vibe?" sub="Select your mood for today" options={[{emoji:"😌",label:"Casual & Chill",value:"casual",onClick:()=>{setMood("casual");setScreen("q4");}},{emoji:"🤫",label:"Quiet & Peaceful",value:"quiet",onClick:()=>{setMood("quiet");setScreen("q4");}},{emoji:"🎉",label:"Fun & Lively",value:"fun",onClick:()=>{setMood("fun");setScreen("q4");}},{emoji:"🕯️",label:"Romantic",value:"romantic",onClick:()=>{setMood("romantic");setScreen("q4");}}]} /></>);

  if (screen === "q4") return (<><style>{css}</style><Navbar user={user} onLogout={handleLogout} onHistory={() => setScreen("history")} onDashboard={() => setScreen("landing")} screen={screen} /><QuestionCard {...qProps} step={4} total={5} progress={80} icon="🍴" title="Food preference?" sub="Choose what you're craving" options={[{emoji:"🥦",label:"Vegetarian",value:"veg",onClick:()=>{setFoodType("veg");setScreen("q5");}},{emoji:"🍗",label:"Non-Vegetarian",value:"non-veg",onClick:()=>{setFoodType("non-veg");setScreen("q5");}},{emoji:"🍽️",label:"Both / Mixed",value:"mixed",onClick:()=>{setFoodType("mixed");setScreen("q5");}},{emoji:"🌱",label:"Vegan",value:"vegan",onClick:()=>{setFoodType("vegan");setScreen("q5");}}]} /></>);

  if (screen === "q5") return (<><style>{css}</style><Navbar user={user} onLogout={handleLogout} onHistory={() => setScreen("history")} onDashboard={() => setScreen("landing")} screen={screen} /><QuestionCard {...qProps} step={5} total={5} progress={100} icon="💰" title="Budget per person?" sub="Select your spending range" options={[{emoji:"₹",label:"Budget  (Under ₹200)",value:"low",onClick:()=>{setBudget("low");setScreen("thinking");}},{emoji:"₹₹",label:"Moderate  (₹200–₹600)",value:"medium",onClick:()=>{setBudget("medium");setScreen("thinking");}},{emoji:"₹₹₹",label:"Premium  (₹600+)",value:"high",onClick:()=>{setBudget("high");setScreen("thinking");}}]} /></>);

  if (screen === "thinking") return (
    <><style>{css}</style>
    <Navbar user={user} onLogout={handleLogout} onHistory={() => setScreen("history")} onDashboard={() => setScreen("landing")} screen={screen} />
    <div className="thinking-page">
      <div className="thinking-card">
        <div className="thinking-spinner">🤔</div>
        <h2>Finding your perfect spot...</h2>
        <div className="thinking-step">{THINKING_STEPS[thinkingIndex]}</div>
        <div className="dot-loader"><span /><span /><span /></div>
      </div>
    </div></>
  );

  if (screen === "result") return (
    <><style>{css}</style>
    <Navbar user={user} onLogout={handleLogout} onHistory={() => setScreen("history")} onDashboard={() => setScreen("landing")} screen={screen} />
    <div className="result-page">
      <div className="result-card">
        <div className="result-badge">✅ High Confidence Match</div>
        <h2>YOUR RECOMMENDATION</h2>
        <div className="result-name">{recommendation?.name || "A Great Spot Near You"}</div>
        <div className="result-reason">{recommendation?.reason || "Perfectly matched to your preferences."}</div>
        <div className="result-tags">
          {[goingWith, time, mood, foodType, budget].filter(Boolean).map(tag => (<span key={tag} className="result-tag">{tag}</span>))}
        </div>
        <div className="result-actions">
          <button className="btn-maps" onClick={openMaps}>📍 Open in Google Maps</button>
          <button className="btn-whatsapp" onClick={shareOnWhatsApp}>💬 Share on WhatsApp</button>
          <button className="btn-restart" onClick={restartFlow}>↺ Start Again</button>
        </div>
      </div>
    </div></>
  );

  return null;
}
