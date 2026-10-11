import os.path
import sys
from dis import pretty_flags

def luhn_kontrol(s):
    n = 16
    d1 = {}
    d2 = {}
    for i in range(1, n + 1):
        d2[i] = int(s[i - 1])
    for i in range(1, n + 1):
        if i % 2 != 0:
            d1[i] = 2 * d2[i]
            if d1[i] > 9:
                d1[i] = int(d1[i] / 10) + d1[i] % 10
        else:
            d1[i] = d2[i]
    tekler_toplami = 0
    ciftler_toplami = 0
    for i in range(1, n + 1):
        if i % 2 != 0:
            tekler_toplami += d1[i]
        else:
            ciftler_toplami += d1[i]
    toplam = tekler_toplami + ciftler_toplami
    if toplam % 10 == 0:
        return True
    else:
        return False

def son_digit_dogrulama(s):
    n = 16
    d1 = {}
    d2 = {}
    for i in range(1, n + 1):
        d2[i] = int(s[i - 1])
    for i in range(1, n):
        d1[i] = d2[n - i]
    for i in range(1, n + 1):
        if i % 2 != 0:
            d1[i] = 2 * d1[i]
            if d1[i] > 9:
                d1[i] = d1[i] - 9
        else:
            d1[i] = d2[i]
    toplam = 0
    for i in range(1, n):
        toplam += d1[i]
    kalan = toplam * 9 % 10
    if kalan == d2[16]:
        return True, kalan
    else:
        return False, -1

s1 = "4268193659278008"
if luhn_kontrol(s1) == True:
    print(s1, ": kart no geçerlidir...")
else:
    print(s1, ": kart no GEÇERSİZDİR...")
print("----------------------------------------------")
sonuc, son_digit = son_digit_dogrulama(s1)
if sonuc == True:
    print(s1, ": kart no geçerlidir...  son digit :", son_digit)
else:
    print(s1, ": kart no GEÇERSİZDİR... son digit :", son_digit)
print("----------------------------------------------")
klasoradi = os.path.dirname(sys.argv[0])
dosyaismi = klasoradi + "/kart_no.txt"

if os.path.isfile(dosyaismi) == True:
    dosyadi = open(dosyaismi, "r")
    i = 0; j = 0
    for s in dosyadi:
        i += 1
        sonuc, cdigit = son_digit_dogrulama(s)
        if sonuc == True:
            j += 1
            s = s.rstrip()
            print("%5d : %5d : %1d : %s" % (i, j, cdigit, s))
    dosyadi.close()
else:
    print(dosyaismi, " diskte mevcut degil...")