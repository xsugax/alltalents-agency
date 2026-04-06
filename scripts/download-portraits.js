// Download all 119 celebrity portraits to website/assets/portraits/
// Run from project root: node scripts/download-portraits.js
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'website', 'assets', 'portraits');
fs.mkdirSync(OUT, { recursive: true });

// ALL 119 portrait URLs — id → url
const PORTRAITS = {
  c1:  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg/330px-Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg',
  c2:  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/LeoPTABFI191125-28_%28cropped%29.jpg/330px-LeoPTABFI191125-28_%28cropped%29.jpg',
  c3:  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Cristiano_Ronaldo_2275_%28cropped%29.jpg/330px-Cristiano_Ronaldo_2275_%28cropped%29.jpg',
  c4:  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Kim_Kardashian_West_2014.jpg/330px-Kim_Kardashian_West_2014.jpg',
  c5:  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Drake_at_The_Carter_Effect_2017_%2836818935200%29_%28cropped%29.jpg/330px-Drake_at_The_Carter_Effect_2017_%2836818935200%29_%28cropped%29.jpg',
  c6:  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Dwayne_Johnson-1809_%28cropped%29.jpg/330px-Dwayne_Johnson-1809_%28cropped%29.jpg',
  c7:  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Charlize-theron-IMG_6045.jpg/330px-Charlize-theron-IMG_6045.jpg',
  c8:  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Keanu_Reeves_at_TIFF_2025_02_%28Cropped%29.jpg/330px-Keanu_Reeves_at_TIFF_2025_02_%28Cropped%29.jpg',
  c9:  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Elon_Musk_-_54820081119_%28cropped%29.jpg/330px-Elon_Musk_-_54820081119_%28cropped%29.jpg',
  c10: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/MKr383631_Salma_Hayek_%28Women_In_Motion%2C_Cannes_2025%29_crop.jpg/330px-MKr383631_Salma_Hayek_%28Women_In_Motion%2C_Cannes_2025%29_crop.jpg',
  c11: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Zendaya_-_2019_by_Glenn_Francis.jpg/330px-Zendaya_-_2019_by_Glenn_Francis.jpg',
  c12: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/330px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png',
  c13: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Rihanna_Fenty_2018.png/330px-Rihanna_Fenty_2018.png',
  c14: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg/330px-Prime_Minister_Keir_Starmer_meets_Sir_Lewis_Hamilton_%2854566928382%29_%28cropped%29.jpg',
  c15: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Virat_Kohli_in_PMO_New_Delhi.jpg/330px-Virat_Kohli_in_PMO_New_Delhi.jpg',
  c16: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Margot_Robbie_2019_by_Glenn_Francis_%28cropped%29.jpg/330px-Margot_Robbie_2019_by_Glenn_Francis_%28cropped%29.jpg',
  c17: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Chris_young_.jpg/330px-Chris_young_.jpg',
  c18: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Tyler_Hynes_at_San_Diego_Comic_Con_2025.jpg/330px-Tyler_Hynes_at_San_Diego_Comic_Con_2025.jpg',
  c19: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Joe_Bonamassa_-_2013_World_Tour_-_Meistersingerhalle_Nuernberg_-_11-03-2013_%28-31534407%29.jpg/330px-Joe_Bonamassa_-_2013_World_Tour_-_Meistersingerhalle_Nuernberg_-_11-03-2013_%28-31534407%29.jpg',
  c20: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Boz_Scaggs_-_Coral_Springs%2C_FL_-_22886393275.jpg/330px-Boz_Scaggs_-_Coral_Springs%2C_FL_-_22886393275.jpg',
  c21: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Robert_Earl_Keen_at_the_Redneck_Country_Club%2C_June_30%2C_2018_MG_1357_%2841334326940%29_%28cropped%29.jpg/330px-Robert_Earl_Keen_at_the_Redneck_Country_Club%2C_June_30%2C_2018_MG_1357_%2841334326940%29_%28cropped%29.jpg',
  c22: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Zach_Bryan_performing_at_Crypto.com_Arena_on_23_Aug_2023_%28cropped%29.jpg/330px-Zach_Bryan_performing_at_Crypto.com_Arena_on_23_Aug_2023_%28cropped%29.jpg',
  c23: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Lainey_Wilson_2024.jpg/330px-Lainey_Wilson_2024.jpg',
  c24: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Chris_Stapleton_Concert_%2848519730107%29_%28cropped%29.jpg/330px-Chris_Stapleton_Concert_%2848519730107%29_%28cropped%29.jpg',
  c25: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Sof%C3%ADa_Vergara_2019_by_Glenn_Francis.jpg/330px-Sof%C3%ADa_Vergara_2019_by_Glenn_Francis.jpg',
  c26: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Emma_Watson_2013.jpg/330px-Emma_Watson_2013.jpg',
  c27: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Kate_Beckinsale_%2829907748884%29_%28cropped2%29.jpg/330px-Kate_Beckinsale_%2829907748884%29_%28cropped2%29.jpg',
  c28: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/JenniferAnistonHWoFFeb2012.jpg/330px-JenniferAnistonHWoFFeb2012.jpg',
  c29: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/EVA_GREEN_CESAR_2020.jpg/330px-EVA_GREEN_CESAR_2020.jpg',
  c30: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Morgan_Wallen_performing_at_Bank_of_America_Stadium.png/330px-Morgan_Wallen_performing_at_Bank_of_America_Stadium.png',
  c31: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Idris_Elba_A_House_of_Dynamite-21_%28cropped%29.jpg/330px-Idris_Elba_A_House_of_Dynamite-21_%28cropped%29.jpg',
  c32: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Viola_Davis_at_the_Air_Premiere_at_SXSW_%28cropped%29.jpg/330px-Viola_Davis_at_the_Air_Premiere_at_SXSW_%28cropped%29.jpg',
  c33: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Michael_B_Jordan_-_Sinners.jpg/330px-Michael_B_Jordan_-_Sinners.jpg',
  c34: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Lupita_Nyong%27o_by_Gage_Skidmore_4.jpg/330px-Lupita_Nyong%27o_by_Gage_Skidmore_4.jpg',
  c35: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Priyanka_Chopra_at_Bulgary_launch%2C_2024_%28cropped%29.jpg',
  c36: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg/330px-Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg',
  c37: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Deepika_Padukone_2025_%281%29.png/330px-Deepika_Padukone_2025_%281%29.png',
  c38: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Lionel_Messi_NE_Revolution_Inter_Miami_7.9.25-178.jpg/330px-Lionel_Messi_NE_Revolution_Inter_Miami_7.9.25-178.jpg',
  c39: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/LeBron_James_%2851959977144%29_%28cropped2%29.jpg/330px-LeBron_James_%2851959977144%29_%28cropped2%29.jpg',
  c40: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Serena_Williams_at_the_2025_International_Tennis_Hall_of_Fame_Induction_Ceremony_Press_Conference_%28cropped%29.jpg/330px-Serena_Williams_at_the_2025_International_Tennis_Hall_of_Fame_Induction_Ceremony_Press_Conference_%28cropped%29.jpg',
  c41: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/NaomiOsaka-smile-2020_%28cropped_tight%29.png/330px-NaomiOsaka-smile-2020_%28cropped_tight%29.png',
  c42: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Simone_Biles_National_Team_2024.jpg/330px-Simone_Biles_National_Team_2024.jpg',
  c43: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2023-11-16_Gala_de_los_Latin_Grammy%2C_03_%28cropped%2902.jpg/330px-2023-11-16_Gala_de_los_Latin_Grammy%2C_03_%28cropped%2902.jpg',
  c44: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Bad_Bunny_2019_by_Glenn_Francis_%28cropped%29.jpg/330px-Bad_Bunny_2019_by_Glenn_Francis_%28cropped%29.jpg',
  c45: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Jennifer_Lopez_at_the_2025_Sundance_Film_Festival_%28cropped_3%29.jpg/330px-Jennifer_Lopez_at_the_2025_Sundance_Film_Festival_%28cropped_3%29.jpg',
  c46: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/2023-11-16_Gala_de_los_Latin_Grammy%2C_20_%28Maluma%29.jpg/330px-2023-11-16_Gala_de_los_Latin_Grammy%2C_20_%28Maluma%29.jpg',
  c47: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Michelle_Yeoh-2268.jpg/330px-Michelle_Yeoh-2268.jpg',
  c48: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Jason_Momoa_%2843055621224%29_%28cropped%29.jpg/330px-Jason_Momoa_%2843055621224%29_%28cropped%29.jpg',
  c49: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Dua_Lipa-69798_%28cropped%29.jpg/330px-Dua_Lipa-69798_%28cropped%29.jpg',
  c50: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ed_Sheeran-6886_%28cropped%29.jpg/330px-Ed_Sheeran-6886_%28cropped%29.jpg',
  c51: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Ariana_Grande_promoting_Wicked_%282024%29.jpg/330px-Ariana_Grande_promoting_Wicked_%282024%29.jpg',
  c52: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg/330px-BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg',
  c53: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/HarryStylesWembley170623_%2865_of_93%29_%2852982678051%29_%28cropped_2%29.jpg/330px-HarryStylesWembley170623_%2865_of_93%29_%2852982678051%29_%28cropped_2%29.jpg',
  c54: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Adele_2016.jpg/330px-Adele_2016.jpg',
  c55: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/BrunoMars24KMagicWorldTourLive_%28cropped%29.jpg/330px-BrunoMars24KMagicWorldTourLive_%28cropped%29.jpg',
  c56: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_Portrait_by_Brian_Ziff.jpg/330px-The_Weeknd_Portrait_by_Brian_Ziff.jpg',
  c57: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Cardi_B_March_2024.png/330px-Cardi_B_March_2024.png',
  c58: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Nicki_Minaj_2025_%283x4_cropped%29.jpg/330px-Nicki_Minaj_2025_%283x4_cropped%29.jpg',
  c59: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/TechCrunch_Disrupt_San_Francisco_2019_-_Day_1_%2848834070763%29_%28cropped%29.jpg/330px-TechCrunch_Disrupt_San_Francisco_2019_-_Day_1_%2848834070763%29_%28cropped%29.jpg',
  c60: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Denzel_Washington_at_the_2025_Cannes_Film_Festival.jpg/330px-Denzel_Washington_at_the_2025_Cannes_Film_Festival.jpg',
  c61: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Angela_Basset_at_the_2025_Cannes_Film_Festival_04_%28cropped%29.jpg/330px-Angela_Basset_at_the_2025_Cannes_Film_Festival_04_%28cropped%29.jpg',
  c62: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Kerry_Washington_in_%282024%29_%28cropped%29.jpg/330px-Kerry_Washington_in_%282024%29_%28cropped%29.jpg',
  c63: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Pedro_Pascal_at_the_2025_Cannes_Film_Festival_04.jpg/330px-Pedro_Pascal_at_the_2025_Cannes_Film_Festival_04.jpg',
  c64: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Ana_de_Armas_%2854462619561%29_%28cropped_3%29.jpg/330px-Ana_de_Armas_%2854462619561%29_%28cropped_3%29.jpg',
  c65: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Goyas_2024_-_Pen%C3%A9lope_Cruz-2_%28cropped%29.jpg/330px-Goyas_2024_-_Pen%C3%A9lope_Cruz-2_%28cropped%29.jpg',
  c66: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Chris_Hemsworth_-_Crime_101.jpg/330px-Chris_Hemsworth_-_Crime_101.jpg',
  c67: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg/330px-Deadpool_2_Japan_Premiere_Red_Carpet_Ryan_Reynolds_%28cropped%29.jpg',
  c68: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Nicole_Kidman-66059_%28cropped%29.jpg/330px-Nicole_Kidman-66059_%28cropped%29.jpg',
  c69: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Hugh_Jackman_by_Gage_Skidmore_3.jpg/330px-Hugh_Jackman_by_Gage_Skidmore_3.jpg',
  c70: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Cate_Blanchett-63298_%28cropped_2%29.jpg/330px-Cate_Blanchett-63298_%28cropped_2%29.jpg',
  c71: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mindy_Kaling_by_Claire_Leahy_%28cropped%29.jpg/330px-Mindy_Kaling_by_Claire_Leahy_%28cropped%29.jpg',
  c72: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Glasto2025-546_%28cropped%29_%282%29.jpg/330px-Glasto2025-546_%28cropped%29_%282%29.jpg',
  c73: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Doja_Cat_x_Amazon1.1_%28cropped%29.jpg/330px-Doja_Cat_x_Amazon1.1_%28cropped%29.jpg',
  c74: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Tyler_the_Creator_%2852163761341%29_%28cropped%29.jpg/330px-Tyler_the_Creator_%2852163761341%29_%28cropped%29.jpg',
  c75: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/J_Balvin_BTTR_Tour_Photo_January_2025.jpg/330px-J_Balvin_BTTR_Tour_Photo_January_2025.jpg',
  c76: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Camila_Cabello_AMAs_2019.png/330px-Camila_Cabello_AMAs_2019.png',
  c77: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/2023-11-16_Gala_de_los_Latin_Grammy%2C_27_%28cropped%29.jpg/330px-2023-11-16_Gala_de_los_Latin_Grammy%2C_27_%28cropped%29.jpg',
  c78: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Jackie_Chan.jpg/330px-Jackie_Chan.jpg',
  c79: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Mahershala_Ali_by_Gage_Skidmore_%28cropped%29.jpg/330px-Mahershala_Ali_by_Gage_Skidmore_%28cropped%29.jpg',
  c80: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/-Hidden_Figures-_Film_Celebration_%28NHQ201612100020%29_%28cropped%29.jpg/330px--Hidden_Figures-_Film_Celebration_%28NHQ201612100020%29_%28cropped%29.jpg',
  c81: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Vin_Diesel_by_Gage_Skidmore_2.jpg/330px-Vin_Diesel_by_Gage_Skidmore_2.jpg',
  c82: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Tom_Holland_during_pro-am_Wentworth_golf_club_2023-2.jpg/330px-Tom_Holland_during_pro-am_Wentworth_golf_club_2023-2.jpg',
  c83: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Untold_2024_-Burna_Boy_%2853927293629%29_%28cropped%29.jpg/330px-Untold_2024_-Burna_Boy_%2853927293629%29_%28cropped%29.jpg',
  c84: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Wizkid_at_Iyanya%27s_album_launch_concert%2C_2013_%28Cropped%29.png',
  c85: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/EltonDocBFILFF101024_%284_of_17%29_%28cropped%29.jpg/330px-EltonDocBFILFF101024_%284_of_17%29_%28cropped%29.jpg',
  c86: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/MaccaLyricsRFH051121_%2815_of_18%29_%28updated%29_%28cropped%29.jpg/330px-MaccaLyricsRFH051121_%2815_of_18%29_%28updated%29_%28cropped%29.jpg',
  c87: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Roger_Federer_2015_%28cropped%29.jpg/330px-Roger_Federer_2015_%28cropped%29.jpg',
  c88: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Rafael_Nadal_en_2024_%28cropped%29.jpg/330px-Rafael_Nadal_en_2024_%28cropped%29.jpg',
  c89: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Trevor_Noah_%2853554114243%29_%28portrait_crop%29.jpg/330px-Trevor_Noah_%2853554114243%29_%28portrait_crop%29.jpg',
  c90: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Novak_Djokovic_2024_Paris_Olympics.jpg/330px-Novak_Djokovic_2024_Paris_Olympics.jpg',
  c91: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Post_Malone_July_2021_%28cropped%29.jpg/330px-Post_Malone_July_2021_%28cropped%29.jpg',
  c92: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/KendrickSZASPurs230725-19_-_54683179509_%28cropped%29_%28cropped%29.jpg/330px-KendrickSZASPurs230725-19_-_54683179509_%28cropped%29_%28cropped%29.jpg',
  c93: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Megan_Thee_Stallion_Adweek_pose.jpg/330px-Megan_Thee_Stallion_Adweek_pose.jpg',
  c94: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Kevin_Hart_2014_%28cropped_2%29.jpg/330px-Kevin_Hart_2014_%28cropped_2%29.jpg',
  c95: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Indian_actor_Amitabh_Bachchan.jpg/330px-Indian_actor_Amitabh_Bachchan.jpg',
  c96: 'https://upload.wikimedia.org/wikipedia/commons/3/32/Ranveer_Singh_in_2023_%281%29_%28cropped%29.jpg',
  c97: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Alia_Bhatt_at_Berlinale_2022_Ausschnitt.jpg/330px-Alia_Bhatt_at_Berlinale_2022_Ausschnitt.jpg',
  c98: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Zayn_Wiki_%28cropped%29.jpg/330px-Zayn_Wiki_%28cropped%29.jpg',
  c99: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Eddie_Murphy_by_David_Shankbone.jpg/330px-Eddie_Murphy_by_David_Shankbone.jpg',
  c100: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Whoopi_Goldberg_Springsteen-71_%28cropped%29.jpg/330px-Whoopi_Goldberg_Springsteen-71_%28cropped%29.jpg',
  c101: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Matt_Rife%2C_2021.jpg/330px-Matt_Rife%2C_2021.jpg',
  c102: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Steven_Tyler_by_Gage_Skidmore_3.jpg/330px-Steven_Tyler_by_Gage_Skidmore_3.jpg',
  c103: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/63/Joe_Perry_2015.jpg/330px-Joe_Perry_2015.jpg',
  c104: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/RM_at_W_Korea_Love_Your_W%2C_November_2023.jpg/330px-RM_at_W_Korea_Love_Your_W%2C_November_2023.jpg',
  c105: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/BTS_Jin_at_Maison_Fred%2C_13_March_2025_04.png/330px-BTS_Jin_at_Maison_Fred%2C_13_March_2025_04.png',
  c106: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/160217_Gaon_Chart_K-POP_Awards_Red_Carpet_BTS_Suga.jpg/330px-160217_Gaon_Chart_K-POP_Awards_Red_Carpet_BTS_Suga.jpg',
  c107: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/J-Hope_at_W_Korea_Breast_Cancer_Campaign%2C_15_October_2025.png/330px-J-Hope_at_W_Korea_Breast_Cancer_Campaign%2C_15_October_2025.png',
  c108: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Jimin_on_the_way_to_SBS_Radio%2C_31_March_2023_%282%29.jpg/330px-Jimin_on_the_way_to_SBS_Radio%2C_31_March_2023_%282%29.jpg',
  c109: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/BTS%27s_V_20251004_04.jpg/330px-BTS%27s_V_20251004_04.jpg',
  c110: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Jung_Kook_of_BTS%2C_February_12%2C_2026_%281%29.png/330px-Jung_Kook_of_BTS%2C_February_12%2C_2026_%281%29.png',
  c111: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Mia_Khalifa_in_2019.png',
  c112: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lana_Rhoades_2-2017_%28cropped%29.jpg/330px-Lana_Rhoades_2-2017_%28cropped%29.jpg',
  c113: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Riley_Reid_2019_by_Glenn_Francis.jpg/330px-Riley_Reid_2019_by_Glenn_Francis.jpg',
  c114: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/20240314_Lisa_Manoban_07.jpg/330px-20240314_Lisa_Manoban_07.jpg',
  c115: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Kim_Jennie_%28%EA%B9%80%EC%A0%9C%EB%8B%88%29_05.jpg/330px-Kim_Jennie_%28%EA%B9%80%EC%A0%9C%EB%8B%88%29_05.jpg',
  c116: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/IU_at_Blue_Dragon_Series_Awards_on_18072025_%2810%29.png/330px-IU_at_Blue_Dragon_Series_Awards_on_18072025_%2810%29.png',
  c117: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Park_Seo-joon_for_Marie_Claire_Korea%2C_2023_%281%29.jpg/330px-Park_Seo-joon_for_Marie_Claire_Korea%2C_2023_%281%29.jpg',
  c118: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Lee_Min-ho_in_December_2025.png/330px-Lee_Min-ho_in_December_2025.png',
  c119: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Song_Joong-ki_at_Style_Icon_Asia_2016.jpg/330px-Song_Joong-ki_at_Style_Icon_Asia_2016.jpg',
};

function getExt(url) {
  const base = url.split('?')[0].split('#')[0];
  const lower = base.toLowerCase();
  return lower.endsWith('.png') ? 'png' : 'jpg';
}

function download(url, dest, retries = 3) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ATA-Portrait-Downloader/1.0)' }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        return download(res.headers.location, dest, retries).then(resolve).catch(reject);
      }
      if (res.statusCode === 429 && retries > 0) {
        file.close();
        fs.unlink(dest, () => {});
        const wait = 15000 + Math.random() * 5000;
        return setTimeout(() => download(url, dest, retries - 1).then(resolve).catch(reject), wait);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(() => resolve()); });
    });
    req.on('error', (e) => { file.close(); fs.unlink(dest, () => {}); reject(e); });
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

const total = Object.keys(PORTRAITS).length;
let done = 0, failed = 0;
const failedList = [];

console.log(`\nDownloading ${total} celebrity portraits...\n`);

// Sequential download with small delay to avoid rate-limiting
async function run() {
  for (const [id, url] of Object.entries(PORTRAITS)) {
    const ext = getExt(url);
    const dest = path.join(OUT, `${id}.${ext}`);
    // Skip if already exists and has size
    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
      done++;
      process.stdout.write(`  ✓ ${id} (cached)\n`);
      continue;
    }
    try {
      await download(url, dest);
      done++;
      process.stdout.write(`  ✓ ${id}.${ext}\n`);
    } catch (e) {
      failed++;
      failedList.push({ id, url, err: e.message });
      process.stdout.write(`  ✗ ${id} — ${e.message}\n`);
    }
    // polite delay to avoid rate-limiting
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n✓ ${done} downloaded  ✗ ${failed} failed\n`);
  if (failedList.length) {
    console.log('FAILED:');
    failedList.forEach(f => console.log(`  ${f.id}: ${f.err}`));
  }

  // Write the local path map for use in data.js update
  const mapLines = Object.entries(PORTRAITS).map(([id, url]) => {
    const ext = getExt(url);
    const dest = path.join(OUT, `${id}.${ext}`);
    const ok = fs.existsSync(dest) && fs.statSync(dest).size > 5000;
    return ok ? `  ${id}: '/assets/portraits/${id}.${ext}'` : `  // ${id}: FAILED`;
  });
  const mapFile = path.join(__dirname, 'portrait-map.js');
  fs.writeFileSync(mapFile, `// Auto-generated portrait local path map\nexport const PORTRAIT_MAP = {\n${mapLines.join(',\n')}\n};\n`);
  console.log(`\nPath map written to scripts/portrait-map.js`);
}

run().catch(console.error);
