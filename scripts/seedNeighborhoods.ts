import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Neighborhood from '@/models/Neighborhood';
import connect from '@/utils/db';

dotenv.config(); // لتحميل MONGODB_URI

const neighborhoodData = [
  { district: '817', parent: 'BYA_Mokld_Dis@817' },
  { district: '602', parent: 'MMN_WAHAB_QDS@ALL_DISTRICTS' },
  { district: '604', parent: 'MMN_WAHAB_QDS@ALL_DISTRICTS' },
  { district: '606', parent: 'MMN_WAHAB_QDS@ALL_DISTRICTS' },
  { district: '614', parent: 'MMN_YAR_DIS@614_618' },
  { district: '618', parent: 'MMN_YAR_DIS@614_618' },
  { district: '610', parent: 'MMN_Yar_Dis@610_612' },
  { district: '612', parent: 'MMN_Yar_Dis@610_612' },
  { district: '608', parent: 'MMN_Yar_Dis@608_616' },
  { district: '616', parent: 'MMN_Yar_Dis@608_616' },
  { district: '211', parent: 'MMN_Zaid_DIS@211_213' },
  { district: '213', parent: 'MMN_Zaid_DIS@211_213' },
  { district: '627', parent: 'MMN_ARKAN_ZON@ALL_DISTRICTS' },
  { district: '615', parent: 'MMN_ARKAN_ZON@ALL_DISTRICTS' },
  { district: '611', parent: 'MMN_Daw_Dis@611_613' },
  { district: '613', parent: 'MMN_ARKAN_ZON@ALL_DISTRICTS' },
  { district: '601', parent: 'MMN_Ame_DIS@601_609' },
  { district: '609', parent: 'MMN_Ame_DIS@601_609' },
  { district: '605', parent: 'MMN_Ame_DIS@601_609' },
  { district: '607', parent: 'MMN_Ame_DIS@601_609' },
  { district: '603', parent: 'MMN_ARKAN_ZON@ALL_DISTRICTS' },
  { district: '617', parent: 'MMN_Ame_DIS@601_609' },
  { district: '621_623_625', parent: 'KDY_ISK_DIS@621_623_625' },
  { district: '408', parent: 'KDY_HUSSEIN_DIS@DISTRICTS' },
  { district: '410', parent: 'KDY_HUSSEIN_DIS@DISTRICTS' },
  { district: '412', parent: 'KDY_HUSSEIN_DIS@DISTRICTS' },
  { district: '404', parent: 'KDY_ISK_DIS@621_623_625' },
  { district: '406', parent: 'KDY_HUSSEIN_DIS@DISTRICTS' },
  { district: '303', parent: 'OMC_Ahmed_Qah@all_districts' },
  { district: '305', parent: 'OMC_Ahmed_Qah@all_districts' },
  { district: '307', parent: 'OMC_Ahmed_Qah@all_districts' },
  { district: '309', parent: 'OMC_Ahmed_Qah@all_districts' },
  { district: '311', parent: 'OMC_Ahmed_Qah@all_districts' },
  { district: '337', parent: 'SHB_Mut_RC@Zon1' },
  { district: '339', parent: 'SHB_Mut_RC@Zon1' },
  { district: '351', parent: 'SHB_Adel_Zon@all_districts' },
  { district: '353', parent: 'SHB_Adel_Zon@all_districts' },
  { district: '503', parent: 'OMC_Zaid_Zon@all_districts' },
  { district: '504', parent: 'OMC_Pst_Dis@506_510_1' },
  { district: '505', parent: 'OMC_Pst_Dis@506_510_1' },
  { district: '506', parent: 'OMC_Pst_Dis@506_510_1' },
  { district: '508', parent: 'OMC_Pst_Dis@508' },
  { district: '510', parent: 'OMC_Pst_Dis@510' },
  { district: '732', parent: 'BLD_Bld_Dis@732' },
];

async function seed() {
  try {
    await connect();



  } catch (error: any) {
    if (error.code === 11000) {
      console.warn('⚠️ Some entries already exist (duplicate keys).');
    } else {
      console.error('❌ Error seeding data:', error);
    }
  } finally {
    await mongoose.disconnect();
    
  }
}

seed();
