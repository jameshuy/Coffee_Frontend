export type PartnerCafeItem = {
  id: string,
  name: string,
  logo: string,
  link: string
}

export const PARTNER_CAFES:PartnerCafeItem[] = [
  {
    id: 'kiosko-bello',
    name: 'Kiosko Bello',
    logo: '/partners/kiosko-bello.jpg',
    link: 'https://www.instagram.com/kiosko_bello/'
  },
  {
    id: 'caffeyolo',
    name: 'Caffèyolo',
    logo: '/partners/caffeyolo.jpg',
    link: 'https://www.caffeyolo.ch/'
  },
  {
    id: 'coffee-twins',
    name: 'Coffee Twins',
    logo: '/partners/coffee-twins.jpg',
    link: 'https://www.instagram.com/_coffee_twins_'
  },
  {
    id: 'papier-beurre',
    name: 'Papier Beurre',
    logo: '/partners/papier-beurre.jpg',
    link: 'https://www.instagram.com/papierbeurre/'
  },
  {
    id: 'united-tastes',
    name: 'United Tastes',
    logo: '/partners/united-tastes.jpg',
    link: 'https://united-tastes.poush-dev.be/'
  }
];