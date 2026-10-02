"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Phone, Mail, MapPin, Building2, CheckCircle2, Send, ArrowRight, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { services } from "@/data/services";
import { contactInfo, formatPhone, primaryPhone, telHref, whatsappHref } from "@/data/contact";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";
import { ContactInfoCard } from "./ContactInfoCard";

type FormState = {
  name: string;
  company: string;
  phone: string;
  email: string;
  service: string;
  message: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  name: "",
  company: "",
  phone: "",
  email: "",
  service: "",
  message: "",
};

const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full rounded-xl border bg-white px-4 py-3 text-base text-brand-dark placeholder:text-black/35 outline-none transition-colors focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 sm:text-sm";

function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: keyof FormState;
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-black/55">
        {label}
        {optional && <span className="ml-1 font-medium normal-case tracking-normal text-black/40">(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-brand-red">
          {error}
        </p>
      )}
    </div>
  );
}

export function Contact() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Service cards link here with data-enquire-service; preselect that service.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest<HTMLElement>("[data-enquire-service]");
      const service = link?.dataset.enquireService;
      if (!service) return;
      setForm((f) => ({ ...f, service }));
      setErrors((err) => ({ ...err, service: undefined }));
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = "Please enter your full name.";
    }
    if (!PHONE_RE.test(form.phone.replace(/\s+/g, ""))) {
      next.phone = "Enter a valid 10-digit mobile number.";
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!form.service) {
      next.service = "Please select a service.";
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      next.message = "Tell us a little more about your project (min. 10 characters).";
    }
    return next;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`#${firstInvalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 900);
  }

  function reset() {
    setForm(initialState);
    setErrors({});
    setSubmitted(false);
  }

  function fieldProps(key: keyof FormState) {
    return {
      id: key,
      name: key,
      value: form[key],
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? `${key}-error` : undefined,
      className: cn(inputClass, errors[key] ? "border-brand-red" : "border-black/10"),
    };
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className="bg-brand-gray pb-20 pt-20 sm:pb-28 sm:pt-28">
      <Container>
        {/* CTA band */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] rounded-bl-none bg-brand-red px-6 py-12 text-white sm:px-12 sm:py-14 lg:flex lg:items-end lg:justify-between lg:gap-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="relative max-w-2xl">
              <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-white/75">
                <span>07</span>
                <span aria-hidden="true" className="h-px w-8 bg-white/40" />
                Contact
              </p>
              <h2
                id="contact-title"
                className="mt-4 font-display text-[2rem] font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl"
              >
                Let&apos;s build your brand together
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
                Have an idea, a campaign or a branding requirement? Tell us
                about it and our team will get back to you.
              </p>
            </div>
            <div className="relative mt-8 flex flex-col gap-3 xs:flex-row xs:flex-wrap lg:mt-0 lg:shrink-0">
              <ButtonLink href="#enquiry" variant="light">
                Start a Project
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink
                href={whatsappHref(primaryPhone, `Hi ${site.name}, I'd like to discuss a campaign.`)}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline-light"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                WhatsApp us
              </ButtonLink>
            </div>
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Details */}
          <div className="lg:col-span-5">
            <h3 className="font-display text-xl font-bold text-brand-dark">Reach us directly</h3>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <ContactInfoCard icon={Phone} label="Phone">
                <span className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {contactInfo.phones.map((phone) => (
                    <a key={phone} href={telHref(phone)} className="hover:text-brand-red">
                      {formatPhone(phone)}
                    </a>
                  ))}
                </span>
              </ContactInfoCard>
              <ContactInfoCard icon={Mail} label="Email & website">
                <a href={`mailto:${contactInfo.email}`} className="block hover:text-brand-red">
                  {contactInfo.email}
                </a>
                <a href={site.url} className="block hover:text-brand-red">
                  {contactInfo.website}
                </a>
              </ContactInfoCard>
              <ContactInfoCard icon={MapPin} label="Office">
                <address className="not-italic">
                  {contactInfo.address.line1}
                  <br />
                  {contactInfo.address.line2}
                </address>
              </ContactInfoCard>
              <ContactInfoCard icon={Building2} label="Registered office">
                <address className="not-italic">
                  {contactInfo.registrationOffice.line1}
                  <br />
                  {contactInfo.registrationOffice.line2}
                </address>
              </ContactInfoCard>
            </div>
          </div>

          {/* Form */}
          <div id="enquiry" className="scroll-mt-24 lg:col-span-7">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-black/5 sm:p-9">
              {submitted ? (
                <div
                  role="status"
                  className="flex min-h-[26rem] animate-fade-in flex-col items-center justify-center text-center"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                    <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 font-display text-2xl font-extrabold text-brand-dark">Enquiry sent!</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-black/60">
                    Thank you for reaching out. Our team will get back to you
                    shortly to discuss your project.
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-brand-dark/15 px-6 text-sm font-bold text-brand-dark transition-colors hover:border-brand-red hover:text-brand-red"
                  >
                    Send another enquiry
                  </button>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
                  <h3 className="font-display text-xl font-bold text-brand-dark">Tell us about your project</h3>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field id="name" label="Name" error={errors.name}>
                      <input
                        {...fieldProps("name")}
                        type="text"
                        autoComplete="name"
                        onChange={(e) => update("name", e.target.value)}
                        placeholder="Your full name"
                      />
                    </Field>
                    <Field id="company" label="Company" optional>
                      <input
                        {...fieldProps("company")}
                        type="text"
                        autoComplete="organization"
                        onChange={(e) => update("company", e.target.value)}
                        placeholder="Your company"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field id="phone" label="Phone" error={errors.phone}>
                      <input
                        {...fieldProps("phone")}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="98765 43210"
                      />
                    </Field>
                    <Field id="email" label="Email" error={errors.email}>
                      <input
                        {...fieldProps("email")}
                        type="email"
                        autoComplete="email"
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="you@email.com"
                      />
                    </Field>
                  </div>

                  <Field id="service" label="Service" error={errors.service}>
                    <select
                      {...fieldProps("service")}
                      onChange={(e) => update("service", e.target.value)}
                      className={cn(fieldProps("service").className, "appearance-none")}
                    >
                      <option value="">Select a service</option>
                      {services.map((s) => (
                        <option key={s.title} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field id="message" label="Project details" error={errors.message}>
                    <textarea
                      {...fieldProps("message")}
                      rows={4}
                      onChange={(e) => update("message", e.target.value)}
                      placeholder="Tell us about your brand and what you'd like to achieve..."
                      className={cn(fieldProps("message").className, "resize-none")}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-red px-7 py-4 text-sm font-bold text-white shadow-lg shadow-brand-red/25 transition-colors hover:bg-brand-red-dark disabled:opacity-70"
                  >
                    {submitting ? (
                      "Sending..."
                    ) : (
                      <>
                        Send enquiry
                        <Send className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
