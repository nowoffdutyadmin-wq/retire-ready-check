import rawConfig from "../../config/webinar-funnel.json";

export type WebinarFunnelConfig = {
  webinar: {
    title: string;
    format: string;
    durationMinutes: number;
    date: string;
    time: string;
    timezone: string;
    replayAvailable: boolean | null;
  };
  cohort: {
    programName: string;
    price: number;
    currency: string;
    capacity: number;
    durationWeeks: number;
    sessionLengthMinutes: number | null;
    dailyPracticeOptions: string[];
  };
  integrations: {
    emailWebhookUrl: string;
    stripePaymentUrl: string;
    supportEmail: string;
  };
  assets: {
    chrisHeadshotUrl: string;
    worksheetPreviewUrl: string;
  };
};

export const webinarFunnelConfig = rawConfig as WebinarFunnelConfig;

export const formattedCohortPrice = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: webinarFunnelConfig.cohort.currency,
  maximumFractionDigits: 0,
}).format(webinarFunnelConfig.cohort.price);

export const isFunnelDevelopment = import.meta.env.DEV;
