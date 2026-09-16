"""Download media referenced by the crawled Wix site into assets/img/ at web sizes."""
import os, sys, urllib.request, pathlib, time

OUT = pathlib.Path('assets/img')
OUT.mkdir(parents=True, exist_ok=True)

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                    '(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      'Referer': 'https://www.shantikalanikketan.com/'}

BASE = 'https://static.wixstatic.com/media/'

# (output name, wix media id, max box width, max box height)
JOBS = [
    # brand
    ('logo-mark.png',        '4c5ada_2d9538c11dea4c22a9e669aa256f475c~mv2.png', 320, 320),
    ('logo-full.png',        '4c5ada_fb42c93141474ab4bc257ebebb795915~mv2_d_1654_1654_s_2.png', 900, 900),
    # business logo declared in Wix SEO data (used for structured data / og)
    ('logo-business.png',    '4c5ada_897fa6d0c4f647be87ed4c7204c7eb52~mv2.png', 900, 900),
    # heroes / wide
    ('hero-home.jpg',        '4c5ada_c0e50b8009b04468ae7a566425277e4b~mv2_d_5069_3384_s_4_2.jpg', 2000, 1400),
    ('hero-about.jpg',       '4c5ada_b714b4e445db441ea419931aedb407c0~mv2_d_4553_3040_s_4_2.jpg', 2000, 1400),
    ('hero-skn.jpg',         '4c5ada_5c13c67cb4c84200a7ef8804638ef3e9~mv2_d_5648_3225_s_4_2.jpg', 2000, 1400),
    ('hero-gurukulam.jpg',   '4c5ada_49932973247a480c9bfe659e13f62653~mv2_d_4609_3077_s_4_2.jpg', 2000, 1400),
    ('hero-events.jpg',      '4c5ada_6581677fcb074974b436af5088eb3607~mv2_d_5760_3840_s_4_2.jpg', 2000, 1400),
    ('hero-photos.jpg',      '4c5ada_963259f75b4142449f3f684d82948c63~mv2_d_6022_4020_s_4_2.jpg', 2000, 1400),
    ('hero-videos.jpg',      '4c5ada_f537640b9718437998ea4caf0d24703a~mv2_d_5760_3840_s_4_2.jpg', 2000, 1400),
    ('hero-contact.jpg',     '4c5ada_89d0aed962e74239bf7c3c527104dad4~mv2_d_5535_3215_s_4_2.jpg', 2000, 1400),
    ('embrace-dance.jpg',    '4c5ada_29445dc608fb401ebbfeed91a380a7c7~mv2_d_6142_3310_s_4_2.jpg', 1800, 1200),
    ('ensemble.jpg',         '4c5ada_20395fca1aca451084a7af3e782cf5d5~mv2_d_3511_2343_s_2.jpg', 1600, 1100),
    # people
    ('founder-omguruom.jpg', '4c5ada_f596ac32810c49d8b667aae421c65710~mv2_d_2210_2368_s_2.jpg', 800, 900),
    # second portrait on the /founder page (original upload: IMG_00810.jpg)
    ('founder-second.jpg',   '4c5ada_ab2b80beb14a424da3b7d80c8edbc1e0~mv2_d_2752_2944_s_4_2.jpg', 800, 900),
    # tiled page background used on /contact (445x180 tile)
    ('bg-contact-tile.jpg',  '4c5ada_108791699aad41ac93fe860b44422c96~mv2.jpg', 890, 360),
    ('sunitta.jpg',          '4c5ada_2f309178136e4d81813f55249a392ebd~mv2.jpg', 800, 900),
    ('team-kirusanthini.jpg','4c5ada_1032a321e35e4c70b6b8caccff080246~mv2.jpg', 800, 900),
    ('team-tejaswi.jpg',     '4c5ada_14538bc698454334b6f4aae396d9f95f~mv2.jpg', 800, 900),
    ('team-nandhini.jpg',    '4c5ada_d9bfef76192344bcbf0dab6d40de5196~mv2.jpg', 800, 900),
    ('team-nanditha.jpg',    '4c5ada_bfb488a30be944df9e95a71d9ed5b8d9~mv2.jpg', 800, 900),
    ('team-anju.jpg',        '4c5ada_816ff95397e0462895358d70b5594194~mv2.jpg', 800, 900),
    ('team-pavithra.jpg',    '4c5ada_466ae39f75ff4951b6891df580a779b6~mv2.jpg', 800, 900),
    ('team-sreelakshmi.jpg', '4c5ada_41e99a5f56d84171bb1733e08622a74f~mv2.jpg', 800, 900),
    # gurukulam stages
    ('stage-1-intro.jpg',    '4c5ada_b498c6645eb843b8a0b84b3d1b410589~mv2.jpg', 1000, 700),
    ('stage-2-foundation.jpg','4c5ada_6a2ff0515ee7440dad2d049da7bc19c3~mv2_d_5362_3579_s_4_2.jpg', 1000, 700),
    ('stage-3-strength.jpg', '4c5ada_7e8eb43accc24975b61ab15d73699775~mv2.jpg', 1000, 700),
    ('stage-4-transition.jpg','4c5ada_de3163c274e64ef39339aec7ea26469c~mv2_d_4911_3276_s_4_2.jpg', 1000, 700),
    ('stage-5-expression.jpg','4c5ada_ba6eb9f3113249e4944fd0a174b33455~mv2.jpg', 1000, 700),
    ('stage-6-maturity.jpg', '4c5ada_b714b4e445db441ea419931aedb407c0~mv2_d_4553_3040_s_4_2.jpg', 1000, 700),
    ('stage-7-arangetram.jpg','4c5ada_6581677fcb074974b436af5088eb3607~mv2_d_5760_3840_s_4_2.jpg', 1000, 700),
    # events
    ('event-udaan-2025.jpg', '4c5ada_12c206b43ad64a4185aac12e1ffda02c~mv2.jpg', 900, 1300),
    ('event-udaan-2023.jpg', '4c5ada_1d711823396a40ca9b46da09a005cccf~mv2.jpg', 900, 1300),
    ('event-festival.jpg',   '4c5ada_329feae506c34b25b17bb35d6deada55~mv2.jpg', 900, 900),
    ('event-jun2024.jpg',    '4c5ada_3e33eaab41bc4d73b244a1b171ff6707~mv2.jpg', 900, 900),
    ('event-aparna.jpg',     '4c5ada_40a1ce9b56d249c88bcd4bc882bd6cdd~mv2.jpg', 900, 900),
    ('event-canada.jpg',     '4c5ada_6955d7662c2e40ebb46e80f9dba66f78~mv2.jpg', 900, 900),
    ('event-nadasudha.jpg',  '4c5ada_8b4242da0a644e7b9ce4efa001fa17a7~mv2.jpg', 900, 900),
    ('event-mylapore.jpg',   '4c5ada_aa56c9733eaa4e1f85b715553a5f0ae4~mv2.jpg', 900, 900),
    ('event-athma.jpg',      '4c5ada_eaf8836c1fab4a2da011adc143fc6888~mv2.jpg', 900, 900),
    ('event-arangetram-k.jpg','4c5ada_f201046dad564caf8aa7c86eeea2cce8~mv2.jpg', 900, 900),
    ('event-arangetram-j.jpg','4c5ada_f86e2fb44bc242a8b71e7881152d5627~mv2.jpg', 900, 900),
    # gallery
    ('gallery-1.jpg',        '4c5ada_ad2c8f7928394dab9e570bf4f05ad2b2~mv2.jpg', 1400, 1400),
    ('gallery-2.jpg',        '4c5ada_ae4c6339c24e4526a2f6c621b0900b85~mv2.jpg', 1400, 1400),
    ('gallery-3.jpg',        '4c5ada_fc229747bfcd433da6655ca694e17320~mv2.jpg', 1400, 1400),
]


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


ok = fail = skip = 0
for name, mid, w, h in JOBS:
    dest = OUT / name
    if dest.exists() and dest.stat().st_size > 2000:
        skip += 1
        continue
    ext = 'png' if name.endswith('.png') else 'jpg'
    urls = [
        f'{BASE}{mid}/v1/fit/w_{w},h_{h},q_88,enc_auto/x.{ext}',
        f'{BASE}{mid}/v1/fill/w_{w},h_{h},al_c,q_88,enc_auto/x.{ext}',
        f'{BASE}{mid}',
    ]
    for u in urls:
        try:
            data = fetch(u)
            if len(data) < 1500:
                continue
            dest.write_bytes(data)
            print(f'OK   {name:26} {len(data)//1024:5} KB')
            ok += 1
            break
        except Exception as e:
            last = e
    else:
        print(f'FAIL {name:26} {last}')
        fail += 1
    time.sleep(0.15)

print(f'\ndone: ok={ok} skipped={skip} failed={fail}')
