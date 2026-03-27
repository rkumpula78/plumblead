# ProMax Water Heaters — PlumbLead Integration Guide

## Option 1: Embed on Existing Website (Recommended)

Add this iframe to any page on promaxwaterheaters.com:

```html
<!-- PlumbLead Instant Quote Tool -->
<iframe 
  src="https://plumblead.ai/clients/promax/?source=website" 
  width="100%" 
  height="800" 
  frameborder="0" 
  style="border: none; max-width: 680px; margin: 0 auto; display: block;"
  title="Get Your Instant Plumbing Quote"
  loading="lazy">
</iframe>
```

## Option 2: Link / Button

Add a button anywhere on the site that links to the quote tool:

```html
<a href="https://plumblead.ai/clients/promax/?source=website" 
   style="display: inline-block; padding: 16px 32px; background: #e63946; color: white; 
          border-radius: 8px; font-weight: 700; font-size: 16px; text-decoration: none;">
  Get Your Instant Quote →
</a>
```

## Option 3: Promo Landing Page (for Google Ads)

Water heater inspection promo:
```
https://plumblead.ai/clients/promax/?promo=water-heater-repair&promoPrice=99&promoLabel=$99+Water+Heater+Inspection&promoBadge=🔥+Limited+Time&source=google-ads&campaign=wh-inspection
```

Drain cleaning promo:
```
https://plumblead.ai/clients/promax/?promo=drain-cleaning&promoPrice=49&promoLabel=$49+Drain+Cleaning&promoBadge=💧+Special+Offer&source=google-ads&campaign=drain-clean
```

## Tracking Parameters

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `source` | Lead source | `website`, `google-ads`, `facebook` |
| `campaign` | Campaign name | `wh-inspection`, `spring-2026` |
| `utm_source` | Google UTM (auto-mapped) | `google`, `facebook` |
| `utm_campaign` | Google UTM (auto-mapped) | `spring-promo` |

## Water Quality Report

Automatically included for all Seattle metro zip codes:
- Seattle, Bellevue, Kirkland, Redmond, Renton, Kent, Everett, Tacoma
- Highlights: soft water (no softener needed), lead risk, PFAS, chlorine
- Drives RO system and filtration upsells

## Lead Delivery

Leads are sent via webhook to:
- **Webhook:** `https://api.plumblead.ai/webhook/plumblead-quote`
- **Payload includes:** name, phone, email, service, urgency, zip, preferred time, source, campaign
- **CRM integration:** Can connect to ServiceTitan, Housecall Pro, or any CRM via n8n

## Support

Contact: ryan@plumblead.ai
