import axios from 'axios';
import logger from '../utils/logger.js';
import { IPFS_GATEWAYS } from '../config/constants.js';
const PINATA_JWT = process.env.PINATA_JWT;

export const uploadToIPFS = async (geoJsonData, parcelId, ownerAddress) => {
    // Test authentication first
    try {
        const authTest = await axios.get(
            "https://api.pinata.cloud/data/testAuthentication",
            {
                headers: { 'Authorization': `Bearer ${PINATA_JWT}` },
                timeout: 30000
            }
        );
        console.log("✅ Pinata auth successful:", authTest.data);
    } catch (authError) {
        console.error("❌ Pinata authentication failed:", authError.response?.data || authError.message);
        throw new Error("IPFS service authentication failed");
    }

    // Upload to Pinata
    const pinataResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
            pinataContent: geoJsonData,
            pinataMetadata: {
                name: `Parcel_${parcelId}_GeoJSON`,
                keyvalues: {
                    parcelId: parcelId.toString(),
                    owner: ownerAddress,
                    timestamp: new Date().toISOString()
                }
            }
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PINATA_JWT}`
            },
            timeout: 60000
        }
    );

    const ipfsCid = pinataResponse.data.IpfsHash;
    if (!ipfsCid) {
        throw new Error("No IPFS hash returned from Pinata");
    }

    console.log(`✅ IPFS upload successful. CID: ${ipfsCid}`);
    return ipfsCid;
};

export const fetchFromIPFS = async (ipfsCid, maxRetries = 3) => {
    const gateways = [
        `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
        `https://ipfs.io/ipfs/${ipfsCid}`,
        `https://cloudflare-ipfs.com/ipfs/${ipfsCid}`,
        `https://gateway.ipfs.io/ipfs/${ipfsCid}`,
        `https://dweb.link/ipfs/${ipfsCid}`
    ];
    
    let lastError = null;
    
    for (const gateway of gateways) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                console.log(`Attempting to fetch from: ${gateway} (attempt ${attempt + 1})`);
                
                const response = await axios.get(gateway, {
                    timeout: 15000,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Cadastre-System/1.0',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                console.log(`✅ Successfully fetched from: ${gateway}`);
                return response.data;
                
            } catch (error) {
                lastError = error;
                console.warn(`❌ Failed to fetch from ${gateway} (attempt ${attempt + 1}):`, error.message);
                
                if (error.response?.status === 429) {
                    const waitTime = Math.pow(2, attempt) * 2000;
                    console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else if (error.response?.status >= 400 && error.response?.status < 500) {
                    break;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
    }
    
    throw new Error(`Failed to fetch from all IPFS gateways. Last error: ${lastError?.message}`);
};

export default { uploadToIPFS, fetchFromIPFS };