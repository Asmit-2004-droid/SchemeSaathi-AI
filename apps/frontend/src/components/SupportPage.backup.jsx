import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiMail, FiMessageCircle, FiShield, FiHelpCircle } from "react-icons/fi";
import { MainLayout } from "./layout";
import { api, apiError } from "../lib/api";
import { useLanguage } from "../lib/i18n.jsx";
import { SupportTickets, supportButton, supportPrimary, supportField } from "./SupportTickets";

const SUPPORT_EMAIL = "customercareprashasti@gmail.com";
const PAGE_SIZE = 100;

export default function SupportPage() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [accountState, setAccountState] = useState("loading");
  const [accountError, setAccountError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdId, setCreatedId] = useState("");

  const loadTickets = useCallback(async (offset = 0) => {
    setLoadingTickets(true); setTicketError("");
    try {
      const { data } = await api.get("/citizen/tickets", { params: { mine: true, limit: PAGE_SIZE, offset } });
      setTickets(current => offset ? [...current, ...data.filter(next => !current.some(old => old.id === next.id))] : data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) { setTicketError(apiError(error)); }
    finally { setLoadingTickets(false); }
  }, []);

  const loadAccount = useCallback(async () => {
    setAccountState("loading"); setAccountError("");
    try {
      setUser((await api.get("/citizen/me")).data);
      setAccountState("ready");
      await loadTickets();
    } catch (error) {
      setAccountState(error.response?.status === 401 ? "anonymous" : "error");
      if (error.response?.status !== 401) setAccountError(apiError(error));
    }
  }, [loadTickets]);
  useEffect(() => { loadAccount(); }, [loadAccount]);

  function updateTicket(ticket) { setTickets(current => current.map(item => item.id === ticket.id ? ticket : item)); }

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    payload.subject = payload.subject.trim(); payload.message = payload.message.trim();
    setSubmitError(""); setCreatedId("");
    if (payload.subject.length < 3 || payload.message.length < 10) { setSubmitError(t("support_form_validation")); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/citizen/tickets", payload);
      setTickets(current => [data, ...current.filter(item => item.id !== data.id)]);
      setCreatedId(data.id); form.reset();
    } catch (error) { setSubmitError(apiError(error)); }
    finally { setBusy(false); }
  }

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t("support_email_subject"))}&body=${encodeURIComponent(t("support_email_body"))}`;
  return <MainLayout><div className="bg-[#f5f7fb]"><section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
    <header className="mb-7 rounded-3xl bg-[#0d2b55] px-6 py-8 text-white sm:px-9">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#d5ae58]/20 text-[#f0cf87]"><FiHelpCircle size={25} aria-hidden="true" /></span>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("support_title")}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">{t("support_intro")}</p>
    </header>
    <div className="grid gap-5 md:grid-cols-2">
      <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <FiMail size={26} className="mb-4 text-[#96712f]" aria-hidden="true" />
        <h2 className="text-xl font-bold text-[#0d2b55]">{t("support_contact_title")}</h2>
        <p className="mt-3 grow text-sm leading-6 text-slate-600">{t("support_contact_note")}</p>
        <a href={mailto} className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[#d5ae58] bg-[#fcf8ee] px-4 py-3 text-sm font-semibold text-[#0d2b55] hover:bg-[#f6edd9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#96712f]"><span className="break-all">{SUPPORT_EMAIL}</span><FiArrowUpRight className="shrink-0" size={20} aria-hidden="true" /></a>
      </article>
      <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <FiMessageCircle size={26} className="mb-4 text-[#96712f]" aria-hidden="true" />
        <h2 className="text-xl font-bold text-[#0d2b55]">{t("support_assistant_title")}</h2>
        <p className="mt-3 grow text-sm leading-6 text-slate-600">{t("support_assistant_note")}</p>
        <Link className={`${supportPrimary} mt-5 justify-between`} to="/ai-assistant">{t("support_assistant_cta")}<FiArrowUpRight size={20} aria-hidden="true" /></Link>
      </article>
    </div>
    <p className="my-5 flex items-start gap-2 text-xs leading-6 text-slate-600"><FiShield className="mt-1 shrink-0 text-[#96712f]" size={16} aria-hidden="true" />{t("support_safety_note")}</p>
    {accountState === "loading" && <p role="status" className="my-7 text-sm text-slate-600">{t("support_loading")}</p>}
    {accountState === "error" && <div className="my-7 rounded-2xl border border-red-200 bg-white p-5"><p role="alert" className="mb-4 text-sm text-red-700">{t(accountError)}</p><button type="button" className={supportButton} onClick={loadAccount}>{t("support_retry")}</button></div>}
    {accountState === "anonymous" && <section className="my-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6"><div><h2 className="font-bold text-[#0d2b55]">{t("support_track_title")}</h2><p className="mt-2 text-sm text-slate-600">{t("support_track_note")}</p></div><Link className={supportPrimary} to="/signin">{t("support_signin_prompt")}</Link></section>}
    {accountState === "ready" && <div className="my-8 space-y-7">
      {["admin", "support"].includes(user?.role) && <Link className={`${supportButton} w-fit`} to="/admin/support">{t("support_manage_link")}<FiArrowUpRight aria-hidden="true" /></Link>}
      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div><h2 className="text-xl font-bold text-[#0d2b55]">{t("support_submit_title")}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t("support_submit_note")}</p></div>
        <label className="block text-sm font-semibold text-slate-700">{t("support_subject_label")}<input name="subject" required minLength={3} maxLength={150} disabled={busy} className={supportField} /></label>
        <label className="block text-sm font-semibold text-slate-700">{t("support_message_label")}<textarea name="message" required minLength={10} maxLength={3000} rows={4} disabled={busy} className={supportField} /></label>
        {submitError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{t(submitError)}</p>}
        {createdId && <p role="status" className="break-words rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{t("support_ticket_created")} <span className="font-semibold">{t("support_ticket_id")}: {createdId}</span></p>}
        <button disabled={busy} className={supportPrimary}>{busy ? t("support_saving") : t("support_submit_button")}</button>
      </form>
      <SupportTickets tickets={tickets} loading={loadingTickets} error={ticketError} onRefresh={() => loadTickets()} onUpdate={updateTicket} hasMore={hasMore} onLoadMore={() => loadTickets(tickets.length)} />
    </div>}
    <section className="mt-9" aria-labelledby="support-faq-title"><h2 id="support-faq-title" className="mb-4 text-xl font-bold text-[#0d2b55]">{t("support_faq_title")}</h2><div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">{[1, 2].map(index => <details key={index} className="group px-6 py-5 open:bg-[#fcf8ee]"><summary className="cursor-pointer text-sm font-semibold leading-6 text-[#0d2b55] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#96712f]">{t(`support_faq_${index}_q`)}</summary><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{t(`support_faq_${index}_a`)}</p></details>)}</div></section>
  </section></div></MainLayout>;
}
