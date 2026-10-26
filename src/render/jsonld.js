'use strict';
const config = require('../config');
const { site, faq, guideService } = require('../data/site');
const { packages } = require('../data/packages');

const abs = (p) => `${config.siteUrl}${p}`;
const ORG_ID = abs('/#organisasi');
const SITE_ID = abs('/#situs');

const organization = () => ({
  '@type': 'TravelAgency',
  '@id': ORG_ID,
  name: site.name,
  alternateName: 'Wulmufikra Togean',
  url: abs('/'),
  logo: abs('/images/logo.png'),
  image: abs('/images/og-image.jpg'),
  description: 'Agen perjalanan paket wisata Kepulauan Togean, Sulawesi Tengah, berangkat dari Manado.',
  telephone: site.phone,
  email: site.email,
  sameAs: [`https://instagram.com/${site.instagram}`],
  areaServed: [
    { '@type': 'Place', name: 'Kepulauan Togean, Sulawesi Tengah' },
    { '@type': 'City', name: 'Manado' },
  ],
  knowsLanguage: ['id', 'en', 'ja'],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: site.phone,
    contactType: 'reservations',
    availableLanguage: ['Indonesian', 'English', 'Japanese'],
  },
});

const website = () => ({
  '@type': 'WebSite', '@id': SITE_ID, url: abs('/'), name: site.name, inLanguage: 'id',
  publisher: { '@id': ORG_ID },
});

const trip = (p, { full = false } = {}) => {
  const node = {
    '@type': 'TouristTrip',
    '@id': abs(`/paket/${p.slug}#paket`),
    name: `Paket Wisata ${p.name} (${p.days} hari)`,
    description: p.tagline,
    url: abs(`/paket/${p.slug}`),
    image: abs(`/images/${p.cover.file}`),
    touristType: ['Wisatawan domestik', 'Wisatawan mancanegara'],
    provider: { '@id': ORG_ID },
    offers: {
      '@type': 'Offer',
      url: abs(`/paket/${p.slug}`),
      price: String(p.price),
      priceCurrency: 'IDR',
      description: 'Harga net untuk 2 orang',
    },
  };
  if (full) {
    node.itinerary = {
      '@type': 'ItemList',
      itemListElement: p.schedule.map((d, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'Event', name: `${d.label}: ${d.title}`, description: d.items.join(' ') },
      })),
    };
  }
  return node;
};

const breadcrumb = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});

const faqPage = () => ({
  '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

const itemList = () => ({
  '@type': 'ItemList',
  name: 'Paket wisata Kepulauan Togean',
  itemListElement: packages.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/paket/${p.slug}`), name: p.name })),
});

const guide = () => ({
  '@type': 'Service',
  '@id': abs('/#pemandu'),
  name: guideService.name,
  description: guideService.intro,
  serviceType: 'Pemandu wisata',
  provider: { '@id': ORG_ID },
  areaServed: { '@type': 'Place', name: 'Kepulauan Togean, Sulawesi Tengah' },
  offers: guideService.prices.map((g) => ({
    '@type': 'Offer', name: `Pemandu wisata ${g.label}`, price: String(g.price), priceCurrency: 'IDR', url: abs('/#pemandu'),
  })),
});

/** Serialisasi aman untuk ditaruh di dalam <script>. */
const toScript = (nodes) =>
  `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c')}</script>`;

module.exports = { organization, website, trip, breadcrumb, faqPage, itemList, guideService: guide, toScript, abs };
