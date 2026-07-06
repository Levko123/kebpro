# Tarhely.eu Node.js telepitesi jegyzet

Ez a projekt tarhely.eu cPanel "Setup Node.js App" kornyezetben is futtathato. A hosting valasza alapjan az Apache Passenger modul szolgaltatja ki az alkalmazast a normal 80/443 portokon, ezert az alkalmazas `PORT` erteke elesben legyen `0`.

## 1. Node.js App

1. cPanel -> Setup Node.js App.
2. Node.js verzio: a tarhelyen elerheto stabil LTS verzio.
3. Application root: a feltoltott projekt mappaja.
4. Application startup file: `app.js`.
5. Passenger log: hagyhato az alapertelmezett application root / docroot log fajlon, vagy allits be kulon log utvonalat.
6. Environment variables: a `.env.tarhely.example` alapjan toltsd ki.

Fontos: ha a felulet portot ker, a hosting utmutatasa szerint `PORT=0` legyen.

## 2. Adatbazis

1. cPanelben hozz letre PostgreSQL adatbazist es felhasznalot.
2. A weboldal localhoston keresztul tud csatlakozni.
3. Allitsd be:

```text
DB_ADAPTER=postgres
DATABASE_URL=postgresql://FELHASZNALO:JELSZO@localhost/ADATBAZIS
```

Ha tavoli PostgreSQL adatbazist kell hasznalni, ahhoz a tarhely.eu ugyfelszolgalatanal hibajegyet kell nyitni.

## 3. Domainek es atiranyitas

1. A `kebpro.hu` legyen a fo domain.
2. A `csirkegyros.hu` es `www.csirkegyros.hu` legyen alias / parkolt domain ugyanarra az alkalmazasra.
3. DNS es webes beallitasok utan az AutoSSL generalja a Let's Encrypt tanusitvanyokat.
4. Az alkalmazas a `csirkegyros.hu` hostrol 301-gyel a megfelelo `kebpro.hu` URL-re iranyit.

## 4. Elesites elotti ellenorzes

Ezeket erdemes ellenorizni elesites utan:

```text
https://kebpro.hu/
https://kebpro.hu/sitemap.xml
https://csirkegyros.hu/bemutatkozas -> https://kebpro.hu/rolunk
https://csirkegyros.hu/termekek-es-gyartas -> https://kebpro.hu/termekek
https://csirkegyros.hu/elerhetoseg -> https://kebpro.hu/kapcsolat
```

## 5. Keresok

Google Search Console-ban a `https://kebpro.hu/sitemap.xml` sitemapet kuldd be. A regi `csirkegyros.hu` domainnel kapcsolatban hasznald a cimvaltozas eszkozt, es a 301 atiranyitasokat legalabb 1 evig tartsd meg.
