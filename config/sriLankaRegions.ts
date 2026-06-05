export const PROVINCE_CODES: Record<string, string> = {
  "Central": "1",
  "Eastern": "2",
  "North Central": "3",
  "North Western": "4",
  "Northern": "5",
  "Sabaragamuwa": "6",
  "Southern": "7",
  "Uva": "8",
  "Western": "9",
};

export const DISTRICT_CODES: Record<string, string> = {
  "Ampara": "01",
  "Anuradhapura": "02",
  "Badulla": "03",
  "Batticaloa": "04",
  "Colombo": "05",
  "Galle": "06",
  "Gampaha": "07",
  "Hambantota": "08",
  "Jaffna": "09",
  "Kalutara": "10",
  "Kandy": "11",
  "Kegalle": "12",
  "Kilinochchi": "13",
  "Kurunegala": "14",
  "Mannar": "15",
  "Matale": "16",
  "Matara": "17",
  "Moneragala": "18",
  "Mullaitivu": "19",
  "Nuwara Eliya": "20",
  "Polonnaruwa": "21",
  "Puttalam": "22",
  "Ratnapura": "23",
  "Trincomalee": "24",
  "Vavuniya": "25",
};

export const sriLankaGeographics: Record<string, Record<string, string[]>> = {
  "Western": {
    "Colombo": [
      "Colombo Municipal Council",
      "Dehiwala-Mount Lavinia Municipal Council",
      "Sri Jayawardenepura Kotte Municipal Council",
      "Kaduwela Municipal Council",
      "Moratuwa Municipal Council",
      "Kolonnawa Urban Council",
      "Maharagama Urban Council",
      "Boralesgamuwa Urban Council",
      "Kesbewa Urban Council",
      "Homagama Pradeshiya Sabha",
      "Seethawaka Pradeshiya Sabha",
      "Kotikawatta-Mulleriyawa Pradeshiya Sabha"
    ],
    "Gampaha": [
      "Negombo Municipal Council",
      "Gampaha Municipal Council",
      "Wattala-Mabole Urban Council",
      "Peliyagoda Urban Council",
      "Ja-Ela Urban Council",
      "Katunayake-Seeduwa Urban Council",
      "Minuwangoda Urban Council",
      "Kelaniya Pradeshiya Sabha",
      "Wattala Pradeshiya Sabha",
      "Biyagama Pradeshiya Sabha",
      "Mahara Pradeshiya Sabha",
      "Dompe Pradeshiya Sabha",
      "Gampaha Pradeshiya Sabha",
      "Ja-Ela Pradeshiya Sabha",
      "Minuwangoda Pradeshiya Sabha",
      "Mirigama Pradeshiya Sabha",
      "Attanagalla Pradeshiya Sabha",
      "Divulapitiya Pradeshiya Sabha"
    ],
    "Kalutara": [
      "Kalutara Urban Council",
      "Panadura Urban Council",
      "Horana Urban Council",
      "Beruwala Urban Council",
      "Kalutara Pradeshiya Sabha",
      "Panadura Pradeshiya Sabha",
      "Horana Pradeshiya Sabha",
      "Bandaragama Pradeshiya Sabha",
      "Madurawela Pradeshiya Sabha",
      "Angalawatta Pradeshiya Sabha",
      "Bulathsinhala Pradeshiya Sabha",
      "Dodangoda Pradeshiya Sabha",
      "Mathugama Pradeshiya Sabha",
      "Walallawita Pradeshiya Sabha",
      "Beruwala Pradeshiya Sabha"
    ]
  },
  "Central": {
    "Kandy": [
      "Kandy Municipal Council",
      "Gampola Urban Council",
      "Kadugannawa Urban Council",
      "Wattegama Urban Council",
      "Harispattuwa Pradeshiya Sabha",
      "Akurana Pradeshiya Sabha",
      "Pathadumbara Pradeshiya Sabha",
      "Panvila Pradeshiya Sabha",
      "Ududumbara Pradeshiya Sabha",
      "Medadumbara Pradeshiya Sabha",
      "Kundasale Pradeshiya Sabha",
      "Kandy Gravets & Gangawata Korale Pradeshiya Sabha",
      "Yatinuwara Pradeshiya Sabha",
      "Udunuwara Pradeshiya Sabha",
      "Doluwa Pradeshiya Sabha",
      "Pathahewaheta Pradeshiya Sabha",
      "Delthota Pradeshiya Sabha",
      "Rambukkana Pradeshiya Sabha",
      "Pasbage Korale Pradeshiya Sabha",
      "Ganga Ihala Korale Pradeshiya Sabha",
      "Pujapitiya Pradeshiya Sabha"
    ],
    "Matale": [
      "Matale Municipal Council",
      "Dambulla Municipal Council",
      "Matale Pradeshiya Sabha",
      "Dambulla Pradeshiya Sabha",
      "Galewela Pradeshiya Sabha",
      "Pallepola Pradeshiya Sabha",
      "Yatawatta Pradeshiya Sabha",
      "Rattota Pradeshiya Sabha",
      "Ukuwela Pradeshiya Sabha",
      "Wilgamuwa Pradeshiya Sabha",
      "Naula Pradeshiya Sabha",
      "Laggala-Pallegama Pradeshiya Sabha"
    ],
    "Nuwara Eliya": [
      "Nuwara Eliya Municipal Council",
      "Hatton-Dickoya Urban Council",
      "Talawakele-Lindula Urban Council",
      "Nuwara Eliya Pradeshiya Sabha",
      "Ambagamuwa Pradeshiya Sabha",
      "Kotmale Pradeshiya Sabha",
      "Hanguranketha Pradeshiya Sabha",
      "Walapane Pradeshiya Sabha",
      "Norwood Pradeshiya Sabha",
      "Maskeliya Pradeshiya Sabha",
      "Agrapatana Pradeshiya Sabha"
    ]
  },
  "Southern": {
    "Galle": [
      "Galle Municipal Council",
      "Ambalangoda Urban Council",
      "Hikkaduwa Urban Council",
      "Galle Gravets Pradeshiya Sabha",
      "Bope-Poddala Pradeshiya Sabha",
      "Akmeemana Pradeshiya Sabha",
      "Habaraduwa Pradeshiya Sabha",
      "Imaduwa Pradeshiya Sabha",
      "Karandeniya Pradeshiya Sabha",
      "Bentota Pradeshiya Sabha",
      "Balapitiya Pradeshiya Sabha",
      "Elpitiya Pradeshiya Sabha",
      "Niyagama Pradeshiya Sabha",
      "Neluwa Pradeshiya Sabha",
      "Thawalama Pradeshiya Sabha",
      "Baddegama Pradeshiya Sabha",
      "Yakkalamulla Pradeshiya Sabha",
      "Ambalangoda Pradeshiya Sabha",
      "Hikkaduwa Pradeshiya Sabha"
    ],
    "Matara": [
      "Matara Municipal Council",
      "Weligama Urban Council",
      "Matara Four Gravets Pradeshiya Sabha",
      "Weligama Pradeshiya Sabha",
      "Devinuwara Pradeshiya Sabha",
      "Dikwella Pradeshiya Sabha",
      "Hakmana Pradeshiya Sabha",
      "Kamburupitiya Pradeshiya Sabha",
      "Thihagoda Pradeshiya Sabha",
      "Malimbada Pradeshiya Sabha",
      "Athuraliya Pradeshiya Sabha",
      "Akuressa Pradeshiya Sabha",
      "Pasgoda Pradeshiya Sabha",
      "Kotapola Pradeshiya Sabha",
      "Mulatiyana Pradeshiya Sabha",
      "Kirinda Puhulwella Pradeshiya Sabha"
    ],
    "Hambantota": [
      "Tangalle Urban Council",
      "Hambantota Municipal Council",
      "Tangalle Pradeshiya Sabha",
      "Hambantota Pradeshiya Sabha",
      "Beliatta Pradeshiya Sabha",
      "Ambalantota Pradeshiya Sabha",
      "Angunakolapelessa Pradeshiya Sabha",
      "Weeraketiya Pradeshiya Sabha",
      "Katuwana Pradeshiya Sabha",
      "Tissamaharama Pradeshiya Sabha",
      "Lunugamvehera Pradeshiya Sabha",
      "Sooriyawewa Pradeshiya Sabha"
    ]
  },
  "Northern": {
    "Jaffna": [
      "Jaffna Municipal Council",
      "Valvettithurai Urban Council",
      "Point Pedro Urban Council",
      "Chavakachcheri Urban Council",
      "Kayts Pradeshiya Sabha",
      "Delft Pradeshiya Sabha",
      "Karainagar Pradeshiya Sabha",
      "Velanai Pradeshiya Sabha",
      "Valikamam West Pradeshiya Sabha",
      "Valikamam North Pradeshiya Sabha",
      "Valikamam East Pradeshiya Sabha",
      "Valikamam South Pradeshiya Sabha",
      "Valikamam South-West Pradeshiya Sabha",
      "Vadamaradchi South-West Pradeshiya Sabha",
      "Point Pedro Pradeshiya Sabha",
      "Chavakachcheri Pradeshiya Sabha",
      "Nallur Pradeshiya Sabha"
    ],
    "Kilinochchi": [
      "Karachchi Pradeshiya Sabha",
      "Poonakary Pradeshiya Sabha",
      "Pachchilaipalli Pradeshiya Sabha"
    ],
    "Mannar": [
      "Mannar Urban Council",
      "Mannar Pradeshiya Sabha",
      "Nanattan Pradeshiya Sabha",
      "Musali Pradeshiya Sabha",
      "Manthai West Pradeshiya Sabha",
      "Madhu Pradeshiya Sabha"
    ],
    "Vavuniya": [
      "Vavuniya Urban Council",
      "Vavuniya South Tamil Pradeshiya Sabha",
      "Vavuniya South Sinhala Pradeshiya Sabha",
      "Vavuniya North Pradeshiya Sabha",
      "Vengalacheddikulam Pradeshiya Sabha"
    ],
    "Mullaitivu": [
      "Maritimepattu Pradeshiya Sabha",
      "Puthukudiyiruppu Pradeshiya Sabha",
      "Thunukkai Pradeshiya Sabha",
      "Manthai East Pradeshiya Sabha",
      "Welioya Pradeshiya Sabha"
    ]
  },
  "Eastern": {
    "Batticaloa": [
      "Batticaloa Municipal Council",
      "Kattankudy Urban Council",
      "Eravur Urban Council",
      "Manmunai Pattu Pradeshiya Sabha",
      "Manmunai North Pradeshiya Sabha",
      "Manmunai South & Eruvil Pattu Pradeshiya Sabha",
      "Manmunai West Pradeshiya Sabha",
      "Manmunai South West Pradeshiya Sabha",
      "Eravur Pattu Pradeshiya Sabha",
      "Koralai Pattu Pradeshiya Sabha",
      "Koralai Pattu West Pradeshiya Sabha",
      "Koralai Pattu South Pradeshiya Sabha",
      "Porativu Pattu Pradeshiya Sabha"
    ],
    "Ampara": [
      "Kalmunai Municipal Council",
      "Ampara Urban Council",
      "Akkaraipattu Municipal Council",
      "Ampara Pradeshiya Sabha",
      "Damana Pradeshiya Sabha",
      "Uhana Pradeshiya Sabha",
      "Lahugala Pradeshiya Sabha",
      "Dehiattakandiya Pradeshiya Sabha",
      "Padiyathalawa Pradeshiya Sabha",
      "Mahaoya Pradeshiya Sabha",
      "Sammanthurai Pradeshiya Sabha",
      "Kalmunai Pradeshiya Sabha",
      "Karaitivu Pradeshiya Sabha",
      "Nintavur Pradeshiya Sabha",
      "Addalaichenai Pradeshiya Sabha",
      "Alayadivembu Pradeshiya Sabha",
      "Akkaraipattu Pradeshiya Sabha",
      "Pottuvil Pradeshiya Sabha",
      "Thirukkovil Pradeshiya Sabha"
    ],
    "Trincomalee": [
      "Trincomalee Urban Council",
      "Trincomalee Town & Gravets Pradeshiya Sabha",
      "Kuchchaveli Pradeshiya Sabha",
      "Gomarankadawala Pradeshiya Sabha",
      "Padavi Sri Pura Pradeshiya Sabha",
      "Morawewa Pradeshiya Sabha",
      "Kantale Pradeshiya Sabha",
      "Seruvila Pradeshiya Sabha",
      "Kinniya Urban Council",
      "Kinniya Pradeshiya Sabha",
      "Mutur Pradeshiya Sabha",
      "Verugal Pradeshiya Sabha"
    ]
  },
  "North Western": {
    "Kurunegala": [
      "Kurunegala Municipal Council",
      "Kuliyapitiya Urban Council",
      "Kurunegala Pradeshiya Sabha",
      "Giribawa Pradeshiya Sabha",
      "Galgamuwa Pradeshiya Sabha",
      "Ehetuwewa Pradeshiya Sabha",
      "Ambanpola Pradeshiya Sabha",
      "Kotavehera Pradeshiya Sabha",
      "Nikaweratiya Pradeshiya Sabha",
      "Maho Pradeshiya Sabha",
      "Polpithigama Pradeshiya Sabha",
      "Ibbagamuwa Pradeshiya Sabha",
      "Ganewatta Pradeshiya Sabha",
      "Wariyapola Pradeshiya Sabha",
      "Kobeigane Pradeshiya Sabha",
      "Bingiriya Pradeshiya Sabha",
      "Panduwasnuwara Pradeshiya Sabha",
      "Kuliyapitiya Pradeshiya Sabha",
      "Udubaddawa Pradeshiya Sabha",
      "Pannala Pradeshiya Sabha",
      "Makandura Pradeshiya Sabha",
      "Narammala Pradeshiya Sabha",
      "Weerambugedara Pradeshiya Sabha",
      "Mawathagama Pradeshiya Sabha",
      "Rideegama Pradeshiya Sabha",
      "Alawwa Pradeshiya Sabha",
      "Polgahawela Pradeshiya Sabha"
    ],
    "Puttalam": [
      "Puttalam Urban Council",
      "Chilaw Urban Council",
      "Kalpitiya Pradeshiya Sabha",
      "Puttalam Pradeshiya Sabha",
      "Vanathavilluwa Pradeshiya Sabha",
      "Karuwalagaswewa Pradeshiya Sabha",
      "Anamaduwa Pradeshiya Sabha",
      "Pallama Pradeshiya Sabha",
      "Arachchikattuwa Pradeshiya Sabha",
      "Chilaw Pradeshiya Sabha",
      "Madampe Pradeshiya Sabha",
      "Mahawewa Pradeshiya Sabha",
      "Nattandiya Pradeshiya Sabha",
      "Dankotuwa Pradeshiya Sabha",
      "Wennappuwa Pradeshiya Sabha"
    ]
  },
  "North Central": {
    "Anuradhapura": [
      "Anuradhapura Municipal Council",
      "Anuradhapura Pradeshiya Sabha",
      "Padaviya Pradeshiya Sabha",
      "Kebithigollewa Pradeshiya Sabha",
      "Medawachchiya Pradeshiya Sabha",
      "Rambewa Pradeshiya Sabha",
      "Kahatagasdigiliya Pradeshiya Sabha",
      "Horowpothana Pradeshiya Sabha",
      "Galenbindunuwewa Pradeshiya Sabha",
      "Mihintale Pradeshiya Sabha",
      "Nuwaragam Palatha Central Pradeshiya Sabha",
      "Nuwaragam Palatha East Pradeshiya Sabha",
      "Vilachchiya Pradeshiya Sabha",
      "Nachchaduwa Pradeshiya Sabha",
      "Noctchiyagama Pradeshiya Sabha",
      "Rajanganaya Pradeshiya Sabha",
      "Galnewa Pradeshiya Sabha",
      "Thalawa Pradeshiya Sabha",
      "Ipalogama Pradeshiya Sabha",
      "Kekirawa Pradeshiya Sabha",
      "Thirappane Pradeshiya Sabha",
      "Habarana Pradeshiya Sabha",
      "Palugaswewa Pradeshiya Sabha"
    ],
    "Polonnaruwa": [
      "Polonnaruwa Municipal Council",
      "Thamankaduwa Pradeshiya Sabha",
      "Hingurakgoda Pradeshiya Sabha",
      "Medirigiriya Pradeshiya Sabha",
      "Lankapura Pradeshiya Sabha",
      "Elahera Pradeshiya Sabha",
      "Welikanda Pradeshiya Sabha",
      "Dimbulagala Pradeshiya Sabha"
    ]
  },
  "Uva": {
    "Badulla": [
      "Badulla Municipal Council",
      "Bandarawela Municipal Council",
      "Haputale Urban Council",
      "Badulla Pradeshiya Sabha",
      "Soranatota Pradeshiya Sabha",
      "Meegahakiula Pradeshiya Sabha",
      "Kandaketiya Pradeshiya Sabha",
      "Ridimaliyadda Pradeshiya Sabha",
      "Mahiyanganaya Pradeshiya Sabha",
      "Passara Pradeshiya Sabha",
      "Lunugala Pradeshiya Sabha",
      "Uva Paranagama Pradeshiya Sabha",
      "Welimada Pradeshiya Sabha",
      "Bandarawela Pradeshiya Sabha",
      "Ella Pradeshiya Sabha",
      "Haputale Pradeshiya Sabha",
      "Haldummulla Pradeshiya Sabha"
    ],
    "Moneragala": [
      "Moneragala Pradeshiya Sabha",
      "Badalkumbura Pradeshiya Sabha",
      "Wellawaya Pradeshiya Sabha",
      "Buttala Pradeshiya Sabha",
      "Siyambalanduwa Pradeshiya Sabha",
      "Medagama Pradeshiya Sabha",
      "Bibile Pradeshiya Sabha",
      "Madulla Pradeshiya Sabha",
      "Kataragama Pradeshiya Sabha",
      "Thanamalwila Pradeshiya Sabha",
      "Sevanagala Pradeshiya Sabha"
    ]
  },
  "Sabaragamuwa": {
    "Ratnapura": [
      "Ratnapura Municipal Council",
      "Balangoda Urban Council",
      "Embilipitiya Urban Council",
      "Ratnapura Pradeshiya Sabha",
      "Imbulpe Pradeshiya Sabha",
      "Balangoda Pradeshiya Sabha",
      "Opanayaka Pradeshiya Sabha",
      "Pelmadulla Pradeshiya Sabha",
      "Elapatha Pradeshiya Sabha",
      "Kuruvita Pradeshiya Sabha",
      "Eheliyagoda Pradeshiya Sabha",
      "Ayagama Pradeshiya Sabha",
      "Kalawana Pradeshiya Sabha",
      "Kahawatta Pradeshiya Sabha",
      "Godakawela Pradeshiya Sabha",
      "Weligepola Pradeshiya Sabha",
      "Embilipitiya Pradeshiya Sabha",
      "Kolonna Pradeshiya Sabha"
    ],
    "Kegalle": [
      "Kegalle Urban Council",
      "Kegalle Pradeshiya Sabha",
      "Galigamuwa Pradeshiya Sabha",
      "Warakapola Pradeshiya Sabha",
      "Ruwanwella Pradeshiya Sabha",
      "Yatiyanthota Pradeshiya Sabha",
      "Dehiowita Pradeshiya Sabha",
      "Deraniyagala Pradeshiya Sabha",
      "Karawanella Pradeshiya Sabha",
      "Rambukkana Pradeshiya Sabha",
      "Mawanella Pradeshiya Sabha",
      "Aranayaka Pradeshiya Sabha"
    ]
  }
};

const DISTRICT_CENTERS: Record<string, { lat: number; lng: number; province: string }> = {
  "Colombo": {
    "lat": 6.9355,
    "lng": 79.8487,
    "province": "Western"
  },
  "Gampaha": {
    "lat": 7.0899,
    "lng": 79.9994,
    "province": "Western"
  },
  "Kalutara": {
    "lat": 6.5793,
    "lng": 79.9648,
    "province": "Western"
  },
  "Kandy": {
    "lat": 7.2906,
    "lng": 80.6336,
    "province": "Central"
  },
  "Matale": {
    "lat": 7.4698,
    "lng": 80.6217,
    "province": "Central"
  },
  "Nuwara Eliya": {
    "lat": 6.9708,
    "lng": 80.7829,
    "province": "Central"
  },
  "Galle": {
    "lat": 6.0461,
    "lng": 80.2103,
    "province": "Southern"
  },
  "Matara": {
    "lat": 5.9485,
    "lng": 80.5353,
    "province": "Southern"
  },
  "Hambantota": {
    "lat": 6.1234,
    "lng": 81.1205,
    "province": "Southern"
  },
  "Jaffna": {
    "lat": 9.6685,
    "lng": 80.0074,
    "province": "Northern"
  },
  "Kilinochchi": {
    "lat": 9.3834,
    "lng": 80.4002,
    "province": "Northern"
  },
  "Mannar": {
    "lat": 8.9778,
    "lng": 79.9093,
    "province": "Northern"
  },
  "Vavuniya": {
    "lat": 8.7514,
    "lng": 80.4971,
    "province": "Northern"
  },
  "Mullaitivu": {
    "lat": 9.2236,
    "lng": 80.7909,
    "province": "Northern"
  },
  "Batticaloa": {
    "lat": 7.7102,
    "lng": 81.6924,
    "province": "Eastern"
  },
  "Ampara": {
    "lat": 7.2975,
    "lng": 81.682,
    "province": "Eastern"
  },
  "Trincomalee": {
    "lat": 8.5778,
    "lng": 81.2289,
    "province": "Eastern"
  },
  "Kurunegala": {
    "lat": 7.4839,
    "lng": 80.3683,
    "province": "North Western"
  },
  "Puttalam": {
    "lat": 8.0362,
    "lng": 79.8283,
    "province": "North Western"
  },
  "Anuradhapura": {
    "lat": 8.3122,
    "lng": 80.4131,
    "province": "North Central"
  },
  "Polonnaruwa": {
    "lat": 7.9329,
    "lng": 81.0082,
    "province": "North Central"
  },
  "Badulla": {
    "lat": 6.9802,
    "lng": 81.0577,
    "province": "Uva"
  },
  "Moneragala": {
    "lat": 6.8695,
    "lng": 81.3454,
    "province": "Uva"
  },
  "Ratnapura": {
    "lat": 6.6931,
    "lng": 80.3995,
    "province": "Sabaragamuwa"
  },
  "Kegalle": {
    "lat": 7.2515,
    "lng": 80.3464,
    "province": "Sabaragamuwa"
  }
};

export const LGA_CENTERS: Record<string, Record<string, Record<string, { lat: number; lng: number }>>> = {
  "Western": {
    "Colombo": {
      "Colombo Municipal Council": {
        "lat": 6.9388614,
        "lng": 79.8542005
      },
      "Dehiwala-Mount Lavinia Municipal Council": {
        "lat": 6.8369601,
        "lng": 79.8672866
      },
      "Sri Jayawardenepura Kotte Municipal Council": {
        "lat": 6.8995498,
        "lng": 79.9058487
      },
      "Kaduwela Municipal Council": {
        "lat": 6.9357027,
        "lng": 79.9843311
      },
      "Moratuwa Municipal Council": {
        "lat": 6.7746821,
        "lng": 79.8826095
      },
      "Kolonnawa Urban Council": {
        "lat": 6.9326254,
        "lng": 79.8903143
      },
      "Maharagama Urban Council": {
        "lat": 6.8472783,
        "lng": 79.9266082
      },
      "Boralesgamuwa Urban Council": {
        "lat": 6.8410598,
        "lng": 79.9017028
      },
      "Kesbewa Urban Council": {
        "lat": 6.7957403,
        "lng": 79.940848
      },
      "Homagama Pradeshiya Sabha": {
        "lat": 6.8412384,
        "lng": 80.0034457
      },
      "Seethawaka Pradeshiya Sabha": {
        "lat": 6.9529483,
        "lng": 80.218633
      },
      "Kotikawatta-Mulleriyawa Pradeshiya Sabha": {
        "lat": 6.9237932,
        "lng": 79.913672
      }
    },
    "Gampaha": {
      "Negombo Municipal Council": {
        "lat": 7.2094282,
        "lng": 79.833117
      },
      "Gampaha Municipal Council": {
        "lat": 7.0925595,
        "lng": 79.9951396
      },
      "Wattala-Mabole Urban Council": {
        "lat": 6.9894897,
        "lng": 79.8932683
      },
      "Peliyagoda Urban Council": {
        "lat": 6.9633651,
        "lng": 79.8818947
      },
      "Ja-Ela Urban Council": {
        "lat": 7.0793775,
        "lng": 79.8907632
      },
      "Katunayake-Seeduwa Urban Council": {
        "lat": 7.1096161,
        "lng": 79.8771943
      },
      "Minuwangoda Urban Council": {
        "lat": 7.1488266,
        "lng": 79.9629756
      },
      "Kelaniya Pradeshiya Sabha": {
        "lat": 6.9541637,
        "lng": 79.9182037
      },
      "Wattala Pradeshiya Sabha": {
        "lat": 6.9898705,
        "lng": 79.8927094
      },
      "Biyagama Pradeshiya Sabha": {
        "lat": 6.9540212,
        "lng": 79.9944255
      },
      "Mahara Pradeshiya Sabha": {
        "lat": 7.0283013,
        "lng": 79.9417501
      },
      "Dompe Pradeshiya Sabha": {
        "lat": 6.9496578,
        "lng": 80.058322
      },
      "Gampaha Pradeshiya Sabha": {
        "lat": 7.0925595,
        "lng": 79.9951396
      },
      "Ja-Ela Pradeshiya Sabha": {
        "lat": 7.0812245,
        "lng": 79.8911363
      },
      "Minuwangoda Pradeshiya Sabha": {
        "lat": 7.1488266,
        "lng": 79.9629756
      },
      "Mirigama Pradeshiya Sabha": {
        "lat": 7.2509324,
        "lng": 80.0936659
      },
      "Attanagalla Pradeshiya Sabha": {
        "lat": 7.1138383,
        "lng": 80.1367665
      },
      "Divulapitiya Pradeshiya Sabha": {
        "lat": 7.2245446,
        "lng": 80.0193654
      }
    },
    "Kalutara": {
      "Kalutara Urban Council": {
        "lat": 6.5852614,
        "lng": 79.963301
      },
      "Panadura Urban Council": {
        "lat": 6.7076216,
        "lng": 79.9369588
      },
      "Horana Urban Council": {
        "lat": 6.6284368,
        "lng": 79.9874864
      },
      "Beruwala Urban Council": {
        "lat": 6.479103,
        "lng": 79.9909065
      },
      "Kalutara Pradeshiya Sabha": {
        "lat": 6.5852614,
        "lng": 79.963301
      },
      "Panadura Pradeshiya Sabha": {
        "lat": 6.7076216,
        "lng": 79.9369588
      },
      "Horana Pradeshiya Sabha": {
        "lat": 6.6284368,
        "lng": 79.9874864
      },
      "Bandaragama Pradeshiya Sabha": {
        "lat": 6.6641188,
        "lng": 79.9723048
      },
      "Madurawela Pradeshiya Sabha": {
        "lat": 6.5852614,
        "lng": 79.963301
      },
      "Angalawatta Pradeshiya Sabha": {
        "lat": 6.5852614,
        "lng": 79.963301
      },
      "Bulathsinhala Pradeshiya Sabha": {
        "lat": 6.6498951,
        "lng": 80.1780249
      },
      "Dodangoda Pradeshiya Sabha": {
        "lat": 6.5547698,
        "lng": 80.0242451
      },
      "Mathugama Pradeshiya Sabha": {
        "lat": 6.532281,
        "lng": 80.1107702
      },
      "Walallawita Pradeshiya Sabha": {
        "lat": 6.3773204,
        "lng": 80.1965314
      },
      "Beruwala Pradeshiya Sabha": {
        "lat": 6.479103,
        "lng": 79.9909065
      }
    }
  },
  "Central": {
    "Kandy": {
      "Kandy Municipal Council": {
        "lat": 7.2931208,
        "lng": 80.6350358
      },
      "Gampola Urban Council": {
        "lat": 7.1647742,
        "lng": 80.5711112
      },
      "Kadugannawa Urban Council": {
        "lat": 7.2572795,
        "lng": 80.5195206
      },
      "Wattegama Urban Council": {
        "lat": 7.3513246,
        "lng": 80.6825933
      },
      "Harispattuwa Pradeshiya Sabha": {
        "lat": 7.2936148,
        "lng": 80.6413453
      },
      "Akurana Pradeshiya Sabha": {
        "lat": 7.36032,
        "lng": 80.60062
      },
      "Pathadumbara Pradeshiya Sabha": {
        "lat": 7.3182634,
        "lng": 80.6221363
      },
      "Panvila Pradeshiya Sabha": {
        "lat": 7.0236203,
        "lng": 80.5355568
      },
      "Ududumbara Pradeshiya Sabha": {
        "lat": 7.3189577,
        "lng": 80.8781956
      },
      "Medadumbara Pradeshiya Sabha": {
        "lat": 7.307493,
        "lng": 80.7630446
      },
      "Kundasale Pradeshiya Sabha": {
        "lat": 7.284675,
        "lng": 80.6840532
      },
      "Kandy Gravets & Gangawata Korale Pradeshiya Sabha": {
        "lat": 7.2931208,
        "lng": 80.6350358
      },
      "Yatinuwara Pradeshiya Sabha": {
        "lat": 7.2956961,
        "lng": 80.6357973
      },
      "Udunuwara Pradeshiya Sabha": {
        "lat": 7.2287252,
        "lng": 80.5742996
      },
      "Doluwa Pradeshiya Sabha": {
        "lat": 7.1845722,
        "lng": 80.6087011
      },
      "Pathahewaheta Pradeshiya Sabha": {
        "lat": 7.2936148,
        "lng": 80.6413453
      },
      "Delthota Pradeshiya Sabha": {
        "lat": 7.1797982,
        "lng": 80.6546258
      },
      "Pasbage Korale Pradeshiya Sabha": {
        "lat": 7.0554112,
        "lng": 80.5361257
      },
      "Ganga Ihala Korale Pradeshiya Sabha": {
        "lat": 7.1264038,
        "lng": 80.5296115
      },
      "Pujapitiya Pradeshiya Sabha": {
        "lat": 7.3920665,
        "lng": 80.5803459
      }
    },
    "Matale": {
      "Matale Municipal Council": {
        "lat": 7.4720453,
        "lng": 80.6234307
      },
      "Dambulla Municipal Council": {
        "lat": 7.8566286,
        "lng": 80.6484958
      },
      "Matale Pradeshiya Sabha": {
        "lat": 7.4720453,
        "lng": 80.6234307
      },
      "Dambulla Pradeshiya Sabha": {
        "lat": 7.8566286,
        "lng": 80.6484958
      },
      "Galewela Pradeshiya Sabha": {
        "lat": 7.7622382,
        "lng": 80.571488
      },
      "Pallepola Pradeshiya Sabha": {
        "lat": 7.6241913,
        "lng": 80.6052415
      },
      "Yatawatta Pradeshiya Sabha": {
        "lat": 7.5656778,
        "lng": 80.5836489
      },
      "Rattota Pradeshiya Sabha": {
        "lat": 7.5189593,
        "lng": 80.6761419
      },
      "Ukuwela Pradeshiya Sabha": {
        "lat": 7.4212501,
        "lng": 80.6331832
      },
      "Wilgamuwa Pradeshiya Sabha": {
        "lat": 7.5158806,
        "lng": 80.9204886
      },
      "Naula Pradeshiya Sabha": {
        "lat": 7.7070389,
        "lng": 80.6530833
      },
      "Laggala-Pallegama Pradeshiya Sabha": {
        "lat": 7.5657262,
        "lng": 80.8333356
      }
    },
    "Nuwara Eliya": {
      "Nuwara Eliya Municipal Council": {
        "lat": 6.9739741,
        "lng": 80.7669855
      },
      "Hatton-Dickoya Urban Council": {
        "lat": 6.8742115,
        "lng": 80.6035311
      },
      "Talawakele-Lindula Urban Council": {
        "lat": 6.9418834,
        "lng": 80.6584488
      },
      "Nuwara Eliya Pradeshiya Sabha": {
        "lat": 6.9739741,
        "lng": 80.7669855
      },
      "Ambagamuwa Pradeshiya Sabha": {
        "lat": 7.0188644,
        "lng": 80.4930254
      },
      "Kotmale Pradeshiya Sabha": {
        "lat": 7.0608024,
        "lng": 80.5969096
      },
      "Hanguranketha Pradeshiya Sabha": {
        "lat": 7.1774712,
        "lng": 80.7755269
      },
      "Walapane Pradeshiya Sabha": {
        "lat": 7.095807,
        "lng": 80.8624363
      },
      "Norwood Pradeshiya Sabha": {
        "lat": 6.8273095,
        "lng": 80.5977455
      },
      "Maskeliya Pradeshiya Sabha": {
        "lat": 6.8436239,
        "lng": 80.5488667
      },
      "Agrapatana Pradeshiya Sabha": {
        "lat": 6.9739741,
        "lng": 80.7669855
      }
    }
  },
  "Southern": {
    "Galle": {
      "Galle Municipal Council": {
        "lat": 6.0328139,
        "lng": 80.214955
      },
      "Ambalangoda Urban Council": {
        "lat": 6.2347391,
        "lng": 80.0544683
      },
      "Hikkaduwa Urban Council": {
        "lat": 6.1186222,
        "lng": 80.1174291
      },
      "Galle Gravets Pradeshiya Sabha": {
        "lat": 6.0328139,
        "lng": 80.214955
      },
      "Bope-Poddala Pradeshiya Sabha": {
        "lat": 6.0602375,
        "lng": 80.2023866
      },
      "Akmeemana Pradeshiya Sabha": {
        "lat": 6.0695562,
        "lng": 80.2609968
      },
      "Habaraduwa Pradeshiya Sabha": {
        "lat": 5.994571,
        "lng": 80.3085378
      },
      "Imaduwa Pradeshiya Sabha": {
        "lat": 6.0354808,
        "lng": 80.3888983
      },
      "Karandeniya Pradeshiya Sabha": {
        "lat": 6.2706811,
        "lng": 80.0911885
      },
      "Bentota Pradeshiya Sabha": {
        "lat": 6.3822823,
        "lng": 80.1165229
      },
      "Balapitiya Pradeshiya Sabha": {
        "lat": 6.2805756,
        "lng": 80.0405753
      },
      "Elpitiya Pradeshiya Sabha": {
        "lat": 6.3202305,
        "lng": 80.1618853
      },
      "Niyagama Pradeshiya Sabha": {
        "lat": 6.2424068,
        "lng": 80.2666175
      },
      "Neluwa Pradeshiya Sabha": {
        "lat": 6.3957685,
        "lng": 80.3815053
      },
      "Thawalama Pradeshiya Sabha": {
        "lat": 6.3386856,
        "lng": 80.3371207
      },
      "Baddegama Pradeshiya Sabha": {
        "lat": 6.1724812,
        "lng": 80.1779163
      },
      "Yakkalamulla Pradeshiya Sabha": {
        "lat": 6.107667,
        "lng": 80.3485356
      },
      "Ambalangoda Pradeshiya Sabha": {
        "lat": 6.2347391,
        "lng": 80.0544683
      },
      "Hikkaduwa Pradeshiya Sabha": {
        "lat": 6.1186222,
        "lng": 80.1174291
      }
    },
    "Matara": {
      "Matara Municipal Council": {
        "lat": 5.947822,
        "lng": 80.5482919
      },
      "Weligama Urban Council": {
        "lat": 5.9672783,
        "lng": 80.422812
      },
      "Matara Four Gravets Pradeshiya Sabha": {
        "lat": 5.947822,
        "lng": 80.5482919
      },
      "Weligama Pradeshiya Sabha": {
        "lat": 5.9672783,
        "lng": 80.422812
      },
      "Devinuwara Pradeshiya Sabha": {
        "lat": 5.9212424,
        "lng": 80.5940257
      },
      "Dikwella Pradeshiya Sabha": {
        "lat": 5.9607364,
        "lng": 80.7041414
      },
      "Hakmana Pradeshiya Sabha": {
        "lat": 5.9590365,
        "lng": 80.5454609
      },
      "Kamburupitiya Pradeshiya Sabha": {
        "lat": 6.0782487,
        "lng": 80.5649161
      },
      "Thihagoda Pradeshiya Sabha": {
        "lat": 6.0127562,
        "lng": 80.565877
      },
      "Malimbada Pradeshiya Sabha": {
        "lat": 6.0087573,
        "lng": 80.516946
      },
      "Athuraliya Pradeshiya Sabha": {
        "lat": 6.0736454,
        "lng": 80.5114076
      },
      "Akuressa Pradeshiya Sabha": {
        "lat": 5.9927315,
        "lng": 80.5200073
      },
      "Pasgoda Pradeshiya Sabha": {
        "lat": 6.2450202,
        "lng": 80.6095383
      },
      "Kotapola Pradeshiya Sabha": {
        "lat": 6.2938122,
        "lng": 80.5441814
      },
      "Mulatiyana Pradeshiya Sabha": {
        "lat": 6.1605117,
        "lng": 80.5844627
      },
      "Kirinda Puhulwella Pradeshiya Sabha": {
        "lat": 6.0406066,
        "lng": 80.618578
      }
    },
    "Hambantota": {
      "Tangalle Urban Council": {
        "lat": 6.0250847,
        "lng": 80.7949279
      },
      "Hambantota Municipal Council": {
        "lat": 6.1249126,
        "lng": 81.1242563
      },
      "Tangalle Pradeshiya Sabha": {
        "lat": 6.0250847,
        "lng": 80.7949279
      },
      "Hambantota Pradeshiya Sabha": {
        "lat": 6.1249126,
        "lng": 81.1242563
      },
      "Beliatta Pradeshiya Sabha": {
        "lat": 6.0648894,
        "lng": 80.7366986
      },
      "Ambalantota Pradeshiya Sabha": {
        "lat": 6.1224627,
        "lng": 81.0238588
      },
      "Angunakolapelessa Pradeshiya Sabha": {
        "lat": 6.1498253,
        "lng": 80.8983742
      },
      "Weeraketiya Pradeshiya Sabha": {
        "lat": 6.1484324,
        "lng": 80.7632359
      },
      "Katuwana Pradeshiya Sabha": {
        "lat": 6.2647248,
        "lng": 80.6910109
      },
      "Tissamaharama Pradeshiya Sabha": {
        "lat": 6.2770724,
        "lng": 81.2892814
      },
      "Lunugamvehera Pradeshiya Sabha": {
        "lat": 6.2229115,
        "lng": 81.1800433
      },
      "Sooriyawewa Pradeshiya Sabha": {
        "lat": 6.3081836,
        "lng": 81.0021826
      }
    }
  },
  "Northern": {
    "Jaffna": {
      "Jaffna Municipal Council": {
        "lat": 9.665093,
        "lng": 80.0093029
      },
      "Valvettithurai Urban Council": {
        "lat": 9.822013,
        "lng": 80.1695508
      },
      "Point Pedro Urban Council": {
        "lat": 9.6623181,
        "lng": 80.008169
      },
      "Chavakachcheri Urban Council": {
        "lat": 9.6571317,
        "lng": 80.1584591
      },
      "Kayts Pradeshiya Sabha": {
        "lat": 9.7007306,
        "lng": 79.8519663
      },
      "Delft Pradeshiya Sabha": {
        "lat": 9.5143958,
        "lng": 79.6810889
      },
      "Karainagar Pradeshiya Sabha": {
        "lat": 9.7252171,
        "lng": 79.8784795
      },
      "Velanai Pradeshiya Sabha": {
        "lat": 9.6370312,
        "lng": 79.9025249
      },
      "Valikamam West Pradeshiya Sabha": {
        "lat": 9.7566727,
        "lng": 79.9519775
      },
      "Valikamam North Pradeshiya Sabha": {
        "lat": 9.7566727,
        "lng": 79.9519775
      },
      "Valikamam East Pradeshiya Sabha": {
        "lat": 9.7566727,
        "lng": 79.9519775
      },
      "Valikamam South Pradeshiya Sabha": {
        "lat": 9.7566727,
        "lng": 79.9519775
      },
      "Valikamam South-West Pradeshiya Sabha": {
        "lat": 9.7566727,
        "lng": 79.9519775
      },
      "Vadamaradchi South-West Pradeshiya Sabha": {
        "lat": 9.8037224,
        "lng": 80.208674
      },
      "Point Pedro Pradeshiya Sabha": {
        "lat": 9.6623181,
        "lng": 80.008169
      },
      "Chavakachcheri Pradeshiya Sabha": {
        "lat": 9.6571317,
        "lng": 80.1584591
      },
      "Nallur Pradeshiya Sabha": {
        "lat": 9.67457,
        "lng": 80.0296574
      }
    },
    "Kilinochchi": {
      "Karachchi Pradeshiya Sabha": {
        "lat": 9.4358811,
        "lng": 80.4075189
      },
      "Poonakary Pradeshiya Sabha": {
        "lat": 9.5043102,
        "lng": 80.2124126
      },
      "Pachchilaipalli Pradeshiya Sabha": {
        "lat": 9.3840068,
        "lng": 80.4087224
      }
    },
    "Mannar": {
      "Mannar Urban Council": {
        "lat": 8.9812896,
        "lng": 79.9043942
      },
      "Mannar Pradeshiya Sabha": {
        "lat": 8.9812896,
        "lng": 79.9043942
      },
      "Nanattan Pradeshiya Sabha": {
        "lat": 8.8356502,
        "lng": 79.967523
      },
      "Musali Pradeshiya Sabha": {
        "lat": 8.7471667,
        "lng": 79.9555042
      },
      "Manthai West Pradeshiya Sabha": {
        "lat": 8.9770791,
        "lng": 79.9147013
      },
      "Madhu Pradeshiya Sabha": {
        "lat": 8.8553675,
        "lng": 80.2030069
      }
    },
    "Vavuniya": {
      "Vavuniya Urban Council": {
        "lat": 8.759971,
        "lng": 80.4971194
      },
      "Vavuniya South Tamil Pradeshiya Sabha": {
        "lat": 8.7539092,
        "lng": 80.4982048
      },
      "Vavuniya South Sinhala Pradeshiya Sabha": {
        "lat": 8.7539092,
        "lng": 80.4982048
      },
      "Vavuniya North Pradeshiya Sabha": {
        "lat": 8.836315,
        "lng": 80.4889352
      },
      "Vengalacheddikulam Pradeshiya Sabha": {
        "lat": 8.836315,
        "lng": 80.4889352
      }
    },
    "Mullaitivu": {
      "Maritimepattu Pradeshiya Sabha": {
        "lat": 9.2703906,
        "lng": 80.8147118
      },
      "Puthukudiyiruppu Pradeshiya Sabha": {
        "lat": 9.3233055,
        "lng": 80.7023426
      },
      "Thunukkai Pradeshiya Sabha": {
        "lat": 9.1431816,
        "lng": 80.2708674
      },
      "Manthai East Pradeshiya Sabha": {
        "lat": 9.3063122,
        "lng": 80.7852227
      },
      "Welioya Pradeshiya Sabha": {
        "lat": 8.9674251,
        "lng": 80.7813763
      }
    }
  },
  "Eastern": {
    "Batticaloa": {
      "Batticaloa Municipal Council": {
        "lat": 7.8381021,
        "lng": 81.5567533
      },
      "Kattankudy Urban Council": {
        "lat": 7.6804861,
        "lng": 81.7289676
      },
      "Eravur Urban Council": {
        "lat": 7.7757162,
        "lng": 81.6048021
      },
      "Manmunai Pattu Pradeshiya Sabha": {
        "lat": 7.7060738,
        "lng": 81.6752024
      },
      "Manmunai North Pradeshiya Sabha": {
        "lat": 7.7060738,
        "lng": 81.6752024
      },
      "Manmunai South & Eruvil Pattu Pradeshiya Sabha": {
        "lat": 7.7074764,
        "lng": 81.6903241
      },
      "Manmunai West Pradeshiya Sabha": {
        "lat": 7.6932428,
        "lng": 81.6489753
      },
      "Manmunai South West Pradeshiya Sabha": {
        "lat": 7.60685,
        "lng": 81.7124767
      },
      "Eravur Pattu Pradeshiya Sabha": {
        "lat": 7.7827517,
        "lng": 81.5898911
      },
      "Koralai Pattu Pradeshiya Sabha": {
        "lat": 7.8618895,
        "lng": 81.5067992
      },
      "Koralai Pattu West Pradeshiya Sabha": {
        "lat": 7.8618895,
        "lng": 81.5067992
      },
      "Koralai Pattu South Pradeshiya Sabha": {
        "lat": 7.8618895,
        "lng": 81.5067992
      },
      "Porativu Pattu Pradeshiya Sabha": {
        "lat": 7.5183851,
        "lng": 81.7583474
      }
    },
    "Ampara": {
      "Kalmunai Municipal Council": {
        "lat": 7.4131557,
        "lng": 81.8269327
      },
      "Ampara Urban Council": {
        "lat": 7.3054105,
        "lng": 81.6700723
      },
      "Akkaraipattu Municipal Council": {
        "lat": 7.2140576,
        "lng": 81.8482489
      },
      "Ampara Pradeshiya Sabha": {
        "lat": 7.3054105,
        "lng": 81.6700723
      },
      "Damana Pradeshiya Sabha": {
        "lat": 7.1882627,
        "lng": 81.6537658
      },
      "Uhana Pradeshiya Sabha": {
        "lat": 7.3608752,
        "lng": 81.640205
      },
      "Lahugala Pradeshiya Sabha": {
        "lat": 6.8778362,
        "lng": 81.7184772
      },
      "Dehiattakandiya Pradeshiya Sabha": {
        "lat": 7.6714995,
        "lng": 81.0408922
      },
      "Padiyathalawa Pradeshiya Sabha": {
        "lat": 7.0737575,
        "lng": 81.8322887
      },
      "Mahaoya Pradeshiya Sabha": {
        "lat": 7.5211119,
        "lng": 81.6078827
      },
      "Sammanthurai Pradeshiya Sabha": {
        "lat": 7.3593354,
        "lng": 81.7846806
      },
      "Kalmunai Pradeshiya Sabha": {
        "lat": 7.4131557,
        "lng": 81.8269327
      },
      "Karaitivu Pradeshiya Sabha": {
        "lat": 7.2922124,
        "lng": 81.6830831
      },
      "Nintavur Pradeshiya Sabha": {
        "lat": 7.3542053,
        "lng": 81.8461203
      },
      "Addalaichenai Pradeshiya Sabha": {
        "lat": 7.2524624,
        "lng": 81.8634549
      },
      "Alayadivembu Pradeshiya Sabha": {
        "lat": 7.2136362,
        "lng": 81.8461045
      },
      "Akkaraipattu Pradeshiya Sabha": {
        "lat": 7.2140576,
        "lng": 81.8482489
      },
      "Pottuvil Pradeshiya Sabha": {
        "lat": 6.8778406,
        "lng": 81.8288673
      },
      "Thirukkovil Pradeshiya Sabha": {
        "lat": 7.1184507,
        "lng": 81.856876
      }
    },
    "Trincomalee": {
      "Trincomalee Urban Council": {
        "lat": 8.576425,
        "lng": 81.2344952
      },
      "Trincomalee Town & Gravets Pradeshiya Sabha": {
        "lat": 8.576425,
        "lng": 81.2344952
      },
      "Kuchchaveli Pradeshiya Sabha": {
        "lat": 8.818264,
        "lng": 81.0996219
      },
      "Gomarankadawala Pradeshiya Sabha": {
        "lat": 8.6745575,
        "lng": 80.9562027
      },
      "Padavi Sri Pura Pradeshiya Sabha": {
        "lat": 8.9287662,
        "lng": 80.8140558
      },
      "Morawewa Pradeshiya Sabha": {
        "lat": 8.576425,
        "lng": 81.2344952
      },
      "Kantale Pradeshiya Sabha": {
        "lat": 8.3670029,
        "lng": 81.0028383
      },
      "Seruvila Pradeshiya Sabha": {
        "lat": 8.576425,
        "lng": 81.2344952
      },
      "Kinniya Urban Council": {
        "lat": 8.4712744,
        "lng": 81.1411414
      },
      "Kinniya Pradeshiya Sabha": {
        "lat": 8.4712744,
        "lng": 81.1411414
      },
      "Mutur Pradeshiya Sabha": {
        "lat": 8.4579687,
        "lng": 81.2667036
      },
      "Verugal Pradeshiya Sabha": {
        "lat": 8.2871468,
        "lng": 81.3979516
      }
    }
  },
  "North Western": {
    "Kurunegala": {
      "Kurunegala Municipal Council": {
        "lat": 7.4870464,
        "lng": 80.364908
      },
      "Kuliyapitiya Urban Council": {
        "lat": 7.4686145,
        "lng": 80.0551026
      },
      "Kurunegala Pradeshiya Sabha": {
        "lat": 7.4870464,
        "lng": 80.364908
      },
      "Giribawa Pradeshiya Sabha": {
        "lat": 8.0969599,
        "lng": 80.2155124
      },
      "Galgamuwa Pradeshiya Sabha": {
        "lat": 7.5585895,
        "lng": 80.3409816
      },
      "Ehetuwewa Pradeshiya Sabha": {
        "lat": 7.9400723,
        "lng": 80.344522
      },
      "Ambanpola Pradeshiya Sabha": {
        "lat": 7.9196719,
        "lng": 80.239316
      },
      "Kotavehera Pradeshiya Sabha": {
        "lat": 7.7279837,
        "lng": 80.257184
      },
      "Nikaweratiya Pradeshiya Sabha": {
        "lat": 7.750383,
        "lng": 80.1157229
      },
      "Maho Pradeshiya Sabha": {
        "lat": 7.8231561,
        "lng": 80.2750922
      },
      "Polpithigama Pradeshiya Sabha": {
        "lat": 7.8172167,
        "lng": 80.4049605
      },
      "Ibbagamuwa Pradeshiya Sabha": {
        "lat": 7.5469875,
        "lng": 80.4492279
      },
      "Ganewatta Pradeshiya Sabha": {
        "lat": 7.6557665,
        "lng": 80.3491357
      },
      "Wariyapola Pradeshiya Sabha": {
        "lat": 7.6190619,
        "lng": 80.2464349
      },
      "Kobeigane Pradeshiya Sabha": {
        "lat": 7.6558352,
        "lng": 80.1264573
      },
      "Bingiriya Pradeshiya Sabha": {
        "lat": 7.5983166,
        "lng": 79.9373361
      },
      "Panduwasnuwara Pradeshiya Sabha": {
        "lat": 7.5996374,
        "lng": 80.1033293
      },
      "Kuliyapitiya Pradeshiya Sabha": {
        "lat": 7.4686145,
        "lng": 80.0551026
      },
      "Udubaddawa Pradeshiya Sabha": {
        "lat": 7.4851477,
        "lng": 79.9646277
      },
      "Pannala Pradeshiya Sabha": {
        "lat": 7.3282953,
        "lng": 80.0243604
      },
      "Makandura Pradeshiya Sabha": {
        "lat": 7.3197313,
        "lng": 79.9687612
      },
      "Narammala Pradeshiya Sabha": {
        "lat": 7.4504338,
        "lng": 80.1850961
      },
      "Weerambugedara Pradeshiya Sabha": {
        "lat": 7.4760781,
        "lng": 80.2423238
      },
      "Mawathagama Pradeshiya Sabha": {
        "lat": 7.4508147,
        "lng": 80.4237506
      },
      "Rideegama Pradeshiya Sabha": {
        "lat": 7.5495194,
        "lng": 80.4911182
      },
      "Alawwa Pradeshiya Sabha": {
        "lat": 7.2942445,
        "lng": 80.2408757
      },
      "Polgahawela Pradeshiya Sabha": {
        "lat": 7.3355381,
        "lng": 80.3002513
      }
    },
    "Puttalam": {
      "Puttalam Urban Council": {
        "lat": 7.9818403,
        "lng": 79.8293371
      },
      "Chilaw Urban Council": {
        "lat": 7.5765074,
        "lng": 79.7956755
      },
      "Kalpitiya Pradeshiya Sabha": {
        "lat": 8.235595,
        "lng": 79.766381
      },
      "Puttalam Pradeshiya Sabha": {
        "lat": 7.9818403,
        "lng": 79.8293371
      },
      "Vanathavilluwa Pradeshiya Sabha": {
        "lat": 7.9818403,
        "lng": 79.8293371
      },
      "Karuwalagaswewa Pradeshiya Sabha": {
        "lat": 8.0571301,
        "lng": 79.9609197
      },
      "Anamaduwa Pradeshiya Sabha": {
        "lat": 7.8776367,
        "lng": 80.0109366
      },
      "Pallama Pradeshiya Sabha": {
        "lat": 7.9818403,
        "lng": 79.8293371
      },
      "Arachchikattuwa Pradeshiya Sabha": {
        "lat": 7.6645563,
        "lng": 79.8369974
      },
      "Chilaw Pradeshiya Sabha": {
        "lat": 7.5765074,
        "lng": 79.7956755
      },
      "Madampe Pradeshiya Sabha": {
        "lat": 7.4954162,
        "lng": 79.8413815
      },
      "Mahawewa Pradeshiya Sabha": {
        "lat": 7.4539599,
        "lng": 79.8283059
      },
      "Nattandiya Pradeshiya Sabha": {
        "lat": 7.4118752,
        "lng": 79.8652073
      },
      "Dankotuwa Pradeshiya Sabha": {
        "lat": 7.2974892,
        "lng": 79.8821873
      },
      "Wennappuwa Pradeshiya Sabha": {
        "lat": 7.3426407,
        "lng": 79.8413079
      }
    }
  },
  "North Central": {
    "Anuradhapura": {
      "Anuradhapura Municipal Council": {
        "lat": 8.334985,
        "lng": 80.4106096
      },
      "Anuradhapura Pradeshiya Sabha": {
        "lat": 8.334985,
        "lng": 80.4106096
      },
      "Padaviya Pradeshiya Sabha": {
        "lat": 8.8339506,
        "lng": 80.7709729
      },
      "Kebithigollewa Pradeshiya Sabha": {
        "lat": 8.6094001,
        "lng": 80.5973048
      },
      "Medawachchiya Pradeshiya Sabha": {
        "lat": 8.5387775,
        "lng": 80.492996
      },
      "Rambewa Pradeshiya Sabha": {
        "lat": 8.4415315,
        "lng": 80.5065701
      },
      "Kahatagasdigiliya Pradeshiya Sabha": {
        "lat": 8.42648,
        "lng": 80.6881685
      },
      "Horowpothana Pradeshiya Sabha": {
        "lat": 8.5488887,
        "lng": 80.823273
      },
      "Galenbindunuwewa Pradeshiya Sabha": {
        "lat": 8.2924454,
        "lng": 80.7189721
      },
      "Mihintale Pradeshiya Sabha": {
        "lat": 8.3583002,
        "lng": 80.5121579
      },
      "Nuwaragam Palatha Central Pradeshiya Sabha": {
        "lat": 8.3246611,
        "lng": 80.4118794
      },
      "Nuwaragam Palatha East Pradeshiya Sabha": {
        "lat": 8.3246611,
        "lng": 80.4118794
      },
      "Vilachchiya Pradeshiya Sabha": {
        "lat": 8.4601717,
        "lng": 80.1548185
      },
      "Nachchaduwa Pradeshiya Sabha": {
        "lat": 8.3213936,
        "lng": 80.4188116
      },
      "Noctchiyagama Pradeshiya Sabha": {
        "lat": 8.334985,
        "lng": 80.4106096
      },
      "Rajanganaya Pradeshiya Sabha": {
        "lat": 8.1625132,
        "lng": 80.2173507
      },
      "Galnewa Pradeshiya Sabha": {
        "lat": 8.0354832,
        "lng": 80.4802068
      },
      "Thalawa Pradeshiya Sabha": {
        "lat": 8.2487499,
        "lng": 80.3547468
      },
      "Ipalogama Pradeshiya Sabha": {
        "lat": 8.0920264,
        "lng": 80.5175489
      },
      "Kekirawa Pradeshiya Sabha": {
        "lat": 8.0407932,
        "lng": 80.5970669
      },
      "Thirappane Pradeshiya Sabha": {
        "lat": 8.2157151,
        "lng": 80.5229819
      },
      "Habarana Pradeshiya Sabha": {
        "lat": 8.0398876,
        "lng": 80.7554997
      },
      "Palugaswewa Pradeshiya Sabha": {
        "lat": 8.0635895,
        "lng": 80.7090898
      }
    },
    "Polonnaruwa": {
      "Polonnaruwa Municipal Council": {
        "lat": 7.9962335,
        "lng": 81.0491723
      },
      "Thamankaduwa Pradeshiya Sabha": {
        "lat": 7.9437819,
        "lng": 81.0074817
      },
      "Hingurakgoda Pradeshiya Sabha": {
        "lat": 8.0127365,
        "lng": 80.9802874
      },
      "Medirigiriya Pradeshiya Sabha": {
        "lat": 7.9297251,
        "lng": 80.6872923
      },
      "Lankapura Pradeshiya Sabha": {
        "lat": 7.9395357,
        "lng": 81.0003387
      },
      "Elahera Pradeshiya Sabha": {
        "lat": 7.7325173,
        "lng": 80.7917091
      },
      "Welikanda Pradeshiya Sabha": {
        "lat": 7.9389531,
        "lng": 81.2232816
      },
      "Dimbulagala Pradeshiya Sabha": {
        "lat": 7.822032,
        "lng": 81.08107
      }
    }
  },
  "Uva": {
    "Badulla": {
      "Badulla Municipal Council": {
        "lat": 6.9900353,
        "lng": 81.0570315
      },
      "Bandarawela Municipal Council": {
        "lat": 6.8304821,
        "lng": 80.9888204
      },
      "Haputale Urban Council": {
        "lat": 6.7810729,
        "lng": 80.9642875
      },
      "Badulla Pradeshiya Sabha": {
        "lat": 6.9900353,
        "lng": 81.0570315
      },
      "Soranatota Pradeshiya Sabha": {
        "lat": 7.0229541,
        "lng": 81.0444241
      },
      "Meegahakiula Pradeshiya Sabha": {
        "lat": 7.0785773,
        "lng": 81.1277402
      },
      "Kandaketiya Pradeshiya Sabha": {
        "lat": 7.1702324,
        "lng": 81.0039992
      },
      "Ridimaliyadda Pradeshiya Sabha": {
        "lat": 6.9900353,
        "lng": 81.0570315
      },
      "Mahiyanganaya Pradeshiya Sabha": {
        "lat": 7.3401663,
        "lng": 80.993126
      },
      "Passara Pradeshiya Sabha": {
        "lat": 6.9277554,
        "lng": 81.1460894
      },
      "Lunugala Pradeshiya Sabha": {
        "lat": 7.0419405,
        "lng": 81.2021768
      },
      "Uva Paranagama Pradeshiya Sabha": {
        "lat": 6.9369226,
        "lng": 80.8890985
      },
      "Welimada Pradeshiya Sabha": {
        "lat": 6.9058393,
        "lng": 80.9098123
      },
      "Bandarawela Pradeshiya Sabha": {
        "lat": 6.8304821,
        "lng": 80.9888204
      },
      "Ella Pradeshiya Sabha": {
        "lat": 6.8736058,
        "lng": 81.0489927
      },
      "Haputale Pradeshiya Sabha": {
        "lat": 6.7810729,
        "lng": 80.9642875
      },
      "Haldummulla Pradeshiya Sabha": {
        "lat": 6.7602163,
        "lng": 80.8808852
      }
    },
    "Moneragala": {
      "Moneragala Pradeshiya Sabha": {
        "lat": 6.877538,
        "lng": 81.3777908
      },
      "Badalkumbura Pradeshiya Sabha": {
        "lat": 6.9025322,
        "lng": 81.2188499
      },
      "Wellawaya Pradeshiya Sabha": {
        "lat": 6.7317804,
        "lng": 81.1018359
      },
      "Buttala Pradeshiya Sabha": {
        "lat": 6.7619728,
        "lng": 81.2465378
      },
      "Siyambalanduwa Pradeshiya Sabha": {
        "lat": 6.9064021,
        "lng": 81.5592089
      },
      "Medagama Pradeshiya Sabha": {
        "lat": 7.0345143,
        "lng": 81.2759979
      },
      "Bibile Pradeshiya Sabha": {
        "lat": 7.1600897,
        "lng": 81.2254141
      },
      "Madulla Pradeshiya Sabha": {
        "lat": 6.979658,
        "lng": 81.3747536
      },
      "Kataragama Pradeshiya Sabha": {
        "lat": 6.4185214,
        "lng": 81.3332693
      },
      "Thanamalwila Pradeshiya Sabha": {
        "lat": 6.4380459,
        "lng": 81.2839633
      },
      "Sevanagala Pradeshiya Sabha": {
        "lat": 6.3587131,
        "lng": 80.9202318
      }
    }
  },
  "Sabaragamuwa": {
    "Ratnapura": {
      "Ratnapura Municipal Council": {
        "lat": 6.5795685,
        "lng": 80.588223
      },
      "Balangoda Urban Council": {
        "lat": 6.654957,
        "lng": 80.7008575
      },
      "Embilipitiya Urban Council": {
        "lat": 6.2849429,
        "lng": 80.8487743
      },
      "Ratnapura Pradeshiya Sabha": {
        "lat": 6.5795685,
        "lng": 80.588223
      },
      "Imbulpe Pradeshiya Sabha": {
        "lat": 6.6945796,
        "lng": 80.6886713
      },
      "Balangoda Pradeshiya Sabha": {
        "lat": 6.654957,
        "lng": 80.7008575
      },
      "Opanayaka Pradeshiya Sabha": {
        "lat": 6.6783486,
        "lng": 80.3930267
      },
      "Pelmadulla Pradeshiya Sabha": {
        "lat": 6.6234343,
        "lng": 80.5431464
      },
      "Elapatha Pradeshiya Sabha": {
        "lat": 6.6560623,
        "lng": 80.3677248
      },
      "Kuruvita Pradeshiya Sabha": {
        "lat": 6.6783486,
        "lng": 80.3930267
      },
      "Eheliyagoda Pradeshiya Sabha": {
        "lat": 6.8531322,
        "lng": 80.2625436
      },
      "Ayagama Pradeshiya Sabha": {
        "lat": 6.6385517,
        "lng": 80.3116589
      },
      "Kalawana Pradeshiya Sabha": {
        "lat": 6.5310929,
        "lng": 80.3964775
      },
      "Kahawatta Pradeshiya Sabha": {
        "lat": 6.5831751,
        "lng": 80.573265
      },
      "Godakawela Pradeshiya Sabha": {
        "lat": 6.5046066,
        "lng": 80.6510274
      },
      "Weligepola Pradeshiya Sabha": {
        "lat": 6.5740021,
        "lng": 80.7043516
      },
      "Embilipitiya Pradeshiya Sabha": {
        "lat": 6.2849429,
        "lng": 80.8487743
      },
      "Kolonna Pradeshiya Sabha": {
        "lat": 6.4012382,
        "lng": 80.6918168
      }
    },
    "Kegalle": {
      "Kegalle Urban Council": {
        "lat": 7.2532006,
        "lng": 80.3454132
      },
      "Kegalle Pradeshiya Sabha": {
        "lat": 7.2532006,
        "lng": 80.3454132
      },
      "Galigamuwa Pradeshiya Sabha": {
        "lat": 7.2357407,
        "lng": 80.3102645
      },
      "Warakapola Pradeshiya Sabha": {
        "lat": 7.2249609,
        "lng": 80.1965392
      },
      "Ruwanwella Pradeshiya Sabha": {
        "lat": 7.0401198,
        "lng": 80.2561877
      },
      "Yatiyanthota Pradeshiya Sabha": {
        "lat": 7.0334272,
        "lng": 80.2894345
      },
      "Dehiowita Pradeshiya Sabha": {
        "lat": 6.9665597,
        "lng": 80.2659166
      },
      "Deraniyagala Pradeshiya Sabha": {
        "lat": 6.9272729,
        "lng": 80.3385122
      },
      "Karawanella Pradeshiya Sabha": {
        "lat": 7.023804,
        "lng": 80.261286
      },
      "Rambukkana Pradeshiya Sabha": {
        "lat": 7.3239273,
        "lng": 80.3957479
      },
      "Mawanella Pradeshiya Sabha": {
        "lat": 7.2488144,
        "lng": 80.4432718
      },
      "Aranayaka Pradeshiya Sabha": {
        "lat": 7.2488144,
        "lng": 80.4432718
      }
    }
  }
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function resolveSrilankaRegion(
  addressObj: any,
  fallbackAddressString: string = "",
  latitude?: number,
  longitude?: number
) {
  // Extract fields and clean them
  const region = (addressObj?.region || "").toLowerCase().trim();
  const district = (addressObj?.district || "").toLowerCase().trim();
  const subregion = (addressObj?.subregion || "").toLowerCase().trim();
  const city = (addressObj?.city || "").toLowerCase().trim();
  const name = (addressObj?.name || "").toLowerCase().trim();
  const street = (addressObj?.street || "").toLowerCase().trim();
  const fullAddress = fallbackAddressString.toLowerCase().trim();

  let resolvedProvince = "";
  let resolvedDistrict = "";
  let resolvedLGA = "";

  // Helper: check if a text contains search string as a whole word/phrase
  const escapeRegExp = (str: string) => str.replace(/[.*+?^\$\{}\(\)\|[\]\\]/g, "\\$&");
  const matches = (search: string) => {
    const cleanSearch = search.toLowerCase().trim();
    if (!cleanSearch) return false;
    const regex = new RegExp(`\\b${escapeRegExp(cleanSearch)}\\b`, "i");
    return (
      regex.test(region) ||
      regex.test(district) ||
      regex.test(subregion) ||
      regex.test(city) ||
      regex.test(name) ||
      regex.test(street) ||
      regex.test(fullAddress)
    );
  };

  // 1. Gather all matching LGAs from address text
  const matchesList: { lga: string; prov: string; dist: string; cleanLga: string }[] = [];
  for (const [provKey, districts] of Object.entries(sriLankaGeographics)) {
    for (const [distKey, lgas] of Object.entries(districts)) {
      for (const lga of lgas) {
        const cleanLga = lga.replace(/ Municipal Council| Urban Council| Pradeshiya Sabha/gi, "").toLowerCase().trim();
        if (cleanLga.length > 3 && matches(cleanLga)) {
          matchesList.push({ lga, prov: provKey, dist: distKey, cleanLga });
        }
      }
    }
  }

  // 2. Sort matches by clean name length in descending order and prioritize non-district names
  if (matchesList.length > 0) {
    matchesList.sort((a, b) => {
      const aIsDistrict = a.cleanLga === a.dist.toLowerCase();
      const bIsDistrict = b.cleanLga === b.dist.toLowerCase();
      if (aIsDistrict && !bIsDistrict) return 1; // push district name down
      if (!aIsDistrict && bIsDistrict) return -1; // pull specific town name up
      return b.cleanLga.length - a.cleanLga.length; // longer name first
    });

    resolvedProvince = matchesList[0].prov;
    resolvedDistrict = matchesList[0].dist;
    resolvedLGA = matchesList[0].lga;
  }

  // 3. If Province not matched, try to find Province via text
  if (!resolvedProvince) {
    for (const provinceKey of Object.keys(sriLankaGeographics)) {
      const cleanProv = provinceKey.toLowerCase().replace(" province", "").trim();
      if (matches(cleanProv)) {
        resolvedProvince = provinceKey;
        break;
      }
    }
  }

  // 4. If Province found but not District, try to find District within that Province via text
  if (resolvedProvince && !resolvedDistrict) {
    for (const districtKey of Object.keys(sriLankaGeographics[resolvedProvince])) {
      const cleanDist = districtKey.toLowerCase().replace(" district", "").trim();
      if (matches(cleanDist)) {
        resolvedDistrict = districtKey;
        break;
      }
    }
  }

  // 5. If Province still not found, try to find District anywhere via text
  if (!resolvedProvince && !resolvedDistrict) {
    for (const [provKey, districts] of Object.entries(sriLankaGeographics)) {
      for (const distKey of Object.keys(districts)) {
        const cleanDist = distKey.toLowerCase().replace(" district", "").trim();
        if (matches(cleanDist)) {
          resolvedProvince = provKey;
          resolvedDistrict = distKey;
          break;
        }
      }
      if (resolvedDistrict) break;
    }
  }

  // 6. Fallback: If District is still not resolved, use coordinates to find the nearest District center!
  if (!resolvedDistrict && typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
    let minDistance = Infinity;
    // If we have resolved Province, restrict search to that province
    const targetProvinces = resolvedProvince ? [resolvedProvince] : Object.keys(sriLankaGeographics);
    
    for (const provKey of targetProvinces) {
      for (const districtKey of Object.keys(sriLankaGeographics[provKey])) {
        const center = DISTRICT_CENTERS[districtKey];
        if (center) {
          const dist = getDistance(latitude, longitude, center.lat, center.lng);
          if (dist < minDistance) {
            minDistance = dist;
            resolvedProvince = provKey;
            resolvedDistrict = districtKey;
          }
        }
      }
    }
  }

  // 7. If we have resolved Province and District, but still no LGA, try matching LGA words/coords
  if (resolvedProvince && resolvedDistrict) {
    const lgas = sriLankaGeographics[resolvedProvince][resolvedDistrict];
    
    if (!resolvedLGA) {
      for (const lga of lgas) {
        const cleanLga = lga.replace(/ Municipal Council| Urban Council| Pradeshiya Sabha/gi, "").toLowerCase().trim();
        if (cleanLga.length > 3 && matches(cleanLga)) {
          resolvedLGA = lga;
          break;
        }
      }
    }

    // Try matching LGA partial words
    if (!resolvedLGA) {
      for (const lga of lgas) {
        const cleanLga = lga.replace(/ Municipal Council| Urban Council| Pradeshiya Sabha/gi, "").toLowerCase().trim();
        const words = cleanLga.split(/\s+/);
        const match = words.some(word => word.length > 3 && matches(word));
        if (match) {
          resolvedLGA = lga;
          break;
        }
      }
    }

    // 8. LGA Centroid fallback: if no LGA matched by text but we have coordinates, check distance to all LGA centers in this district
    if (!resolvedLGA && typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
      const districtLgas = LGA_CENTERS[resolvedProvince]?.[resolvedDistrict];
      if (districtLgas) {
        let minLgaDistance = Infinity;
        let nearestLGA = "";
        
        for (const [lgaName, center] of Object.entries(districtLgas)) {
          if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
            const dist = getDistance(latitude, longitude, center.lat, center.lng);
            if (dist < minLgaDistance) {
              minLgaDistance = dist;
              nearestLGA = lgaName;
            }
          }
        }
        
        if (nearestLGA) {
          resolvedLGA = nearestLGA;
        }
      }
    }

    // 9. Ultimate fallback: if still no LGA matched, use the first LGA in the district (usually the main city/council)
    if (!resolvedLGA && lgas.length > 0) {
      resolvedLGA = lgas[0];
    }
  }

  return {
    province: resolvedProvince || "Unknown Province",
    district: resolvedDistrict || "Unknown District",
    localGovernmentArea: resolvedLGA || "Unknown Area"
  };
}
