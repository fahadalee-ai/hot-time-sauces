import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BackBar } from "@/components/Chrome";
import { FireButton } from "@/components/FireButton";
import { ProductCard } from "@/components/ProductCard";
import { CONTACT_EMAIL, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/data/config";
import { brandList, giftCards, newestItems, site } from "@/lib/catalog";
import { useApp } from "@/lib/store";

function Article({ title, text, href }: { title: string; text: string; href?: string }) {
  const blocks = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return (
    <div>
      <BackBar title={title} />
      <article className="space-y-3 px-4 pb-8 pt-4 text-sm leading-relaxed text-ash">
        {blocks.length === 0 ? <p>We couldn't load this page from the store. Open it on the website.</p> : blocks.map((block) => <p key={block.slice(0, 40)}>{block}</p>)}
        {href && (
          <a href={href} className="inline-block font-semibold text-flame" target="_blank" rel="noreferrer">
            Read the full page
          </a>
        )}
      </article>
    </div>
  );
}

export function AboutScreen() {
  return <Article title="About Us" text={site.about} href="https://hottimesauces.com/pages/about-us" />;
}

export function PrivacyScreen() {
  return <Article title="Privacy" text={site.privacy} href="https://hottimesauces.com/policies/privacy-policy" />;
}

export function ReturnsScreen() {
  return <Article title="Returns" text={site.returns} href="https://hottimesauces.com/policies/refund-policy" />;
}

export function FaqScreen() {
  return (
    <div>
      <BackBar title="Help / FAQ" />
      <div className="space-y-3 px-4 pb-8 pt-4">
        {site.faq.length === 0 && <p className="text-sm text-ash">FAQ didn't load. Email {SUPPORT_EMAIL}.</p>}
        {site.faq.map((item) => (
          <details key={item.q} className="rounded-[20px] bg-char px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-cream">{item.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-ash">{item.a}</p>
          </details>
        ))}
        <a href="https://hottimesauces.com/pages/faqs" className="inline-block pt-2 text-sm font-semibold text-flame">
          Full FAQ on the website
        </a>
      </div>
    </div>
  );
}

export function ContactScreen() {
  const { pushToast } = useApp();
  const [sent, setSent] = useState(false);
  return (
    <div>
      <BackBar title="Contact" />
      <div className="space-y-3 px-4 pb-8 pt-4 text-sm text-ash">
        <p>{site.contact || `You can contact us anytime at ${CONTACT_EMAIL} or call ${SUPPORT_PHONE}.`}</p>
        <p>
          Support desk: <a className="text-flame" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
        <p>
          Store line: <a className="text-flame" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> · {SUPPORT_PHONE}
        </p>
        <div className="flex gap-3 text-sm font-semibold">
          <a className="text-flame" href={site.social.instagram}>Instagram</a>
          <a className="text-flame" href={site.social.youtube}>YouTube</a>
          <a className="text-flame" href={site.social.facebook}>Facebook</a>
        </div>
        {sent ? (
          <p className="text-ok">Message saved on this device. Email the desk to actually reach the store.</p>
        ) : (
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              // TODO: Send this through the store contact form / Shopify. This demo only confirms the fields.
              setSent(true);
              pushToast("Noted locally — email the store to reach a person.");
            }}
          >
            <input required aria-label="Your name" placeholder="Your name" className="field" />
            <input required type="email" aria-label="Your email" placeholder="Your email" className="field" />
            <textarea required aria-label="Message" placeholder="Message" className="field h-28 py-3" />
            <FireButton className="!mt-6" type="submit">Send</FireButton>
          </form>
        )}
      </div>
    </div>
  );
}

export function ShuScreen() {
  return (
    <div>
      <BackBar title="Pepper SHU" />
      <div className="space-y-4 px-4 pb-8 pt-4">
        <p className="text-sm leading-relaxed text-ash">
          Scoville Heat Units from the Hot Time Sauces pepper guide. The charts below are the images published on the store.
        </p>
        {site.shuImages.length === 0 && <p className="text-sm text-ash">The chart images didn't load.</p>}
        {site.shuImages.map((src) => (
          <img key={src} src={src} alt="Pepper Scoville heat chart from Hot Time Sauces" className="w-full rounded-[20px] bg-char" />
        ))}
        <a href="https://hottimesauces.com/pages/pepper-shu" className="inline-block text-sm font-semibold text-flame">
          Open the SHU page
        </a>
      </div>
    </div>
  );
}

export function BlogScreen() {
  return (
    <div>
      <BackBar title="Sauce Blog" />
      <div className="space-y-3 px-4 pb-8 pt-4">
        {site.articles.length === 0 ? (
          <p className="text-sm leading-relaxed text-ash">
            The public article feed didn't return posts this time. The Sauce Blog still lives on the store.
          </p>
        ) : (
          site.articles.map((article) => (
            <a key={article.id} href={article.url} className="sauce-card block overflow-hidden">
              {article.image && <img src={article.image} alt="" className="h-36 w-full object-cover" />}
              <div className="p-3">
                <p className="font-semibold">{article.title}</p>
                <p className="mt-1 text-sm text-ash">{article.excerpt}</p>
              </div>
            </a>
          ))
        )}
        <a href="https://hottimesauces.com/blogs/blog-sauces" className="inline-block text-sm font-semibold text-flame">
          Read the blog
        </a>
      </div>
    </div>
  );
}

export function BrandsScreen() {
  const [q, setQ] = useState("");
  const brands = useMemo(() => brandList().filter((brand) => brand.name.toLowerCase().includes(q.trim().toLowerCase())), [q]);
  return (
    <div>
      <BackBar title="Brands" />
      <div className="px-4 pt-4">
        <input aria-label="Filter brands" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Find a brand" className="field mb-3" />
      </div>
      <ul>
        {brands.map((brand) => (
          <li key={brand.name}>
            <Link to="/brand/$name" params={{ name: encodeURIComponent(brand.name) }} className="flex min-h-12 items-center justify-between border-t border-smoke px-4 text-sm">
              {brand.name}
              <span className="text-ash">{brand.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GiftsScreen() {
  const cards = giftCards();
  return (
    <div>
      <BackBar title="E-Gift Cards" />
      <div className="grid grid-cols-2 gap-3 px-4 pb-6 pt-4">
        {cards.map((product) => (
          <ProductCard key={product.handle} product={product} />
        ))}
      </div>
      {cards.length === 0 && <p className="px-4 pt-6 text-sm text-ash">Gift cards aren't in the catalog right now.</p>}
    </div>
  );
}

export function PepperWeekScreen() {
  const fresh = newestItems(4);
  return (
    <div>
      <BackBar title="Pepper of the Week" />
      <div className="px-4 pb-6 pt-4">
        <p className="text-sm leading-relaxed text-ash">
          Hot Time Sauces features a pepper on the website. This build didn't find a separate Pepper of the Week collection in the menu, so here are the newest sauces while you check the blog.
        </p>
        <a href="https://hottimesauces.com/blogs/blog-sauces" className="mt-3 inline-block text-sm font-semibold text-flame">
          See this week's pick
        </a>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {fresh.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
