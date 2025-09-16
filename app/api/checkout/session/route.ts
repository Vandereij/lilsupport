import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const CURRENCY = (process.env.STRIPE_DEFAULT_CURRENCY || "usd").toLowerCase();
const FEE_BPS = parseInt(process.env.PLATFORM_FEE_BPS ?? "500", 10);
const PRICE_MAP: Record<string, string | undefined> = {
    "3": process.env.STRIPE_PRICE_ID_TIP_3_USD,
    "5": process.env.STRIPE_PRICE_ID_TIP_5_USD,
    "10": process.env.STRIPE_PRICE_ID_TIP_10_USD,
};

function clampAmount(minorUnits: number) {
    return Math.min(Math.max(minorUnits, 100), 50000);
}

export async function POST(req: NextRequest) {
    try {
        // Basic env sanity (prevents empty-body 500s)
        const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supaSrv = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const siteUrl = process.env.SITE_URL;
        if (!supaUrl || !supaSrv) throw new Error("Supabase env missing (URL/Service key)");
        if (!siteUrl) throw new Error("SITE_URL env missing");

        const { supporterId, recipientUsername, preset, amountPence, message } =
            (await req.json()) as {
                supporterId?: string | null;
                recipientUsername?: string;
                preset?: "3" | "5" | "10";
                amountPence?: number;
                message?: string;
            };

        const hasPreset = preset && PRICE_MAP[preset];
        const hasCustom = Number.isFinite(amountPence) && amountPence! >= 100;

        if (!hasPreset && !hasCustom) {
            return NextResponse.json(
                { error: "Missing or invalid amount" },
                { status: 400 }
            );
        }

        if (!recipientUsername) {
            return NextResponse.json({ error: "Missing recipientUsername" }, { status: 400 });
        }

        const supabase = createClient(supaUrl, supaSrv);
        const { data: recipient } = await supabase
            .from("profiles")
            .select("id, username, stripe_account_id, is_pro")
            .eq("username", recipientUsername)
            .maybeSingle();

        if (!recipient) {
            return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
        }
        if (!recipient.stripe_account_id) {
            return NextResponse.json(
                { error: "Recipient not onboarded to payouts (stripe_account_id missing)" },
                { status: 400 }
            );
        }

        const feeBps = recipient.is_pro ? 0 : FEE_BPS;

        const successUrl =
            (process.env.STRIPE_SUCCESS_URL || `${siteUrl}/u/{USERNAME}?status=success`)
                .replace("{USERNAME}", recipient.username);
        const cancelUrl =
            (process.env.STRIPE_CANCEL_URL || `${siteUrl}/u/{USERNAME}?status=cancel`)
                .replace("{USERNAME}", recipient.username);

        let line_items: any[] = [];
        let applicationFeeAmount: number;

        if (preset && PRICE_MAP[preset]) {
            const unitAmount = preset === "3" ? 300 : preset === "5" ? 500 : 1000;
            applicationFeeAmount = Math.floor((unitAmount * feeBps) / 10_000);
            line_items = [{ price: PRICE_MAP[preset], quantity: 1 }];
        } else {
            const safeAmount = clampAmount(Math.floor(amountPence || 0));
            applicationFeeAmount = Math.floor((safeAmount * feeBps) / 10_000);
            line_items = [{
                price_data: {
                    currency: CURRENCY,
                    product_data: {
                        name: `Support @${recipient.username}`,
                        description: message ? String(message).slice(0, 140) : "Thank you!",
                    },
                    unit_amount: safeAmount,
                },
                quantity: 1,
            }];
        }

        const cleanSupporterId =
            supporterId && supporterId !== recipient.id ? supporterId : null;

        const taxEnabled = process.env.STRIPE_TAX_ENABLED === "true";

        const msg = message ? String(message).slice(0, 140) : "";

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            currency: CURRENCY,
            line_items,
            success_url: successUrl,
            cancel_url: cancelUrl,
            payment_intent_data: {
                application_fee_amount: applicationFeeAmount,
                transfer_data: { destination: recipient.stripe_account_id },
                description: `One-time tip for @${recipient.username}`,
            },
            customer_creation: "always",
            ...(taxEnabled ? { automatic_tax: { enabled: true } } : {}),
            metadata: {
                kind: "one_time_tip",
                supporter_id: cleanSupporterId ?? "",
                recipient_id: recipient.id,
                recipient_username: recipient.username,
                message: msg,
            },

        });

        return NextResponse.json({ url: session.url });
    } catch (e: any) {
        console.error("checkout/session error:", e);
        const msg = e?.raw?.message || e?.message || "Unknown error";
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
