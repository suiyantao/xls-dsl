use aes::cipher::{block_padding::Pkcs7, BlockDecryptMut, BlockEncryptMut, KeyIvInit};
use base64::Engine;
use deno_core::{error::AnyError, op2};
use rand::thread_rng;
use rsa::{Pkcs1v15Encrypt, RsaPrivateKey, RsaPublicKey, pkcs1::{DecodeRsaPublicKey}};

#[warn(unused)]
type Aes256CbcEnc = cbc::Encryptor<aes::Aes256>;

type Aes256CbcDec = cbc::Decryptor<aes::Aes256>;

// 实现aes加密
/// # 参数
/// - `key`: 加密密钥，以字符串形式表示。
/// - `iv`: 初始化向量，以字符串形式表示。
/// - `data`: 要加密的数据，以字符串形式表示。
/// # 返回值
/// - 加密后的字符串，以字符串形式表示。
/// # 错误
/// - 如果密钥或初始化向量长度不是32或16字节，将返回错误。
/// - 如果数据长度不是16字节的倍数，将返回错误。
/// # 示例
/// ```
/// let key = "01234567890123456789012345678901";
/// let iv = "0123456789012345";
/// let data = "hello world";
/// let res = op_crypto_aes_encrypt(key.to_string(), iv.to_string(), data.to_string()).unwrap();
/// assert_eq!(res, "Y9sxkD7SXOkcsYw0uXssiw==".to_string());
/// ```
fn crypto_aes_encrypt(key: String, iv: String, data: String) -> Result<String, AnyError> {
    let key: [u8; 32] = match key.into_bytes().try_into() {
        Ok(key) => key,
        Err(bytes) => {
            return Err(AnyError::msg(format!(
                "Expected a length of 32 bytes, but got {}",
                bytes.len()
            )))
        }
    };
    let iv: [u8; 16] = match iv.into_bytes().try_into() {
        Ok(iv) => iv,
        Err(bytes) => {
            return Err(AnyError::msg(format!(
                "Expected a length of 16 bytes, but got {}",
                bytes.len()
            )))
        }
    };

    let cipher = Aes256CbcEnc::new(&key.into(), &iv.into());
    let res = cipher.encrypt_padded_vec_mut::<Pkcs7>(data.as_bytes());
    Ok(base64::engine::general_purpose::STANDARD.encode(res))
}

/// # 参数
/// - `key`: 加密密钥，以字符串形式表示。
/// - `iv`: 初始化向量，以字符串形式表示。
/// - `data`: 要加密的数据，以字符串形式表示。
/// # 返回值
/// - 加密后的字符串，以字符串形式表示。
/// # 错误
/// - 如果密钥或初始化向量长度不是32或16字节，将返回错误。
/// - 如果数据长度不是16字节的倍数，将返回错误。
/// # 示例
/// ```
/// let key = "01234567890123456789012345678901";
/// let iv = "0123456789012345";
/// let data = "hello world";
/// let res = op_crypto_aes_encrypt(key.to_string(), iv.to_string(), data.to_string()).unwrap();
/// assert_eq!(res, "Y9sxkD7SXOkcsYw0uXssiw==".to_string());
/// ```
#[op2]
#[string]
pub fn op_crypto_aes_encrypt(
    #[string] key: String,
    #[string] iv: String,
    #[string] data: String,
) -> Result<String, AnyError> {
    crypto_aes_encrypt(key, iv, data)
}

// x 实现aes解密
/// # 参数
/// - `key`: 解密密钥，以字符串形式表示。
/// - `iv`: 初始化向量，以字符串形式表示。
/// - `data`: 要解密的数据，以字符串形式表示。
/// # 返回值
/// - 解密后的字符串，以字符串形式表示。
/// # 错误
/// - 如果密钥或初始化向量长度不是32或16字节，将返回错误。
/// - 如果数据长度不是16字节的倍数，将返回错误。
/// # 示例
/// ```
/// let key = "01234567890123456789012345678901";
/// let iv = "0123456789012345";
/// let data = "Y9sxkD7SXOkcsYw0uXssiw==";
/// let res = op_crypto_aes_decrypt(key.to_string(), iv.to_string(), data.to_string()).unwrap();
/// assert_eq!(res, "hello world".to_string());
/// ```
fn crypto_aes_decrypt(key: String, iv: String, data: String) -> Result<String, AnyError> {
    let data = base64::engine::general_purpose::STANDARD.decode(data)?;
    let key: [u8; 32] = match key.into_bytes().try_into() {
        Ok(key) => key,
        Err(bytes) => {
            return Err(AnyError::msg(format!(
                "Expected a length of 32 bytes, but got {}",
                bytes.len()
            )))
        }
    };
    let iv: [u8; 16] = match iv.into_bytes().try_into() {
        Ok(iv) => iv,
        Err(bytes) => {
            return Err(AnyError::msg(format!(
                "Expected a length of 16 bytes, but got {}",
                bytes.len()
            )))
        }
    };

    let cipher = Aes256CbcDec::new(&key.into(), &iv.into());
    let res = cipher.decrypt_padded_vec_mut::<Pkcs7>(&data);
    match res {
        Ok(res) => Ok(String::from_utf8(res).unwrap()),
        Err(e) => Err(AnyError::msg(format!("Decrypt error: {:?}", e))),
    }
}

/// # 参数
/// - `key`: 解密密钥，以字符串形式表示。
/// - `iv`: 初始化向量，以字符串形式表示。
/// - `data`: 要解密的数据，以字符串形式表示。
/// # 返回值
/// - 解密后的字符串，以字符串形式表示。
/// # 错误
/// - 如果密钥或初始化向量长度不是32或16字节，将返回错误。
/// - 如果数据长度不是16字节的倍数，将返回错误。
/// # 示例
/// ```
/// let key = "01234567890123456789012345678901";
/// let iv = "0123456789012345";
/// let data = "Y9sxkD7SXOkcsYw0uXssiw==";
/// let res = op_crypto_aes_decrypt(key.to_string(), iv.to_string(), data.to_string()).unwrap();
/// assert_eq!(res, "hello world".to_string());
/// ```
#[op2]
#[string]
pub fn op_crypto_aes_decrypt(
    #[string] key: String,
    #[string] iv: String,
    #[string] data: String,
) -> Result<String, AnyError> {
    crypto_aes_decrypt(key, iv, data)
}

// 实现rsa加密
/// # 参数
/// - `key`: 加密密钥，以字符串形式表示。
/// - `data`: 要加密的数据，以字符串形式表示。
/// # 返回值
/// - 加密后的字符串，以字符串形式表示。
/// # 错误
/// - 如果密钥长度不是32字节，将返回错误。
/// - 如果数据长度不是32字节的倍数，将返回错误。
/// # 示例
/// ```
/// let key = "01234567890123456789012345678901";
/// let data = "hello world";
/// let res = crypto_rsa_encrypt(key.to_string(), data.to_string()).unwrap();
/// assert_eq!(res, "Y9sxkD7SXOkcsYw0uXssiw==".to_string());
/// ```
pub fn crypto_rsa_encrypt(key: String, data: String) -> Result<String, AnyError> {
    let pub_key = match RsaPublicKey::from_pkcs1_pem(key.as_str()) {
        Ok(key) => key,
        Err(e) => {
            return Err(AnyError::msg(format!("RSA public key error: {:?}", e)))
        }
    };
    let mut rng = thread_rng();
    let res = match pub_key.encrypt( &mut rng,Pkcs1v15Encrypt,data.as_bytes()) {
        Ok(res) => res,
        Err(e) => {
            return Err(AnyError::msg(format!("RSA encrypt error: {:?}", e)))
        }
    };
    Ok(base64::engine::general_purpose::STANDARD.encode(res))
}

#[cfg(test)]
mod tests {
    use crate::deno::crypto_funs::crypto_aes_decrypt;
    use crate::deno::crypto_funs::crypto_aes_encrypt;
    use crate::deno::crypto_funs::crypto_rsa_encrypt;

    #[test]
    fn test_op_crypto_aes_encrypt() {
        let key = "01234567890123456789012345678901";
        let iv = "0123456789012345";
        let data = "hello world";
        let res = crypto_aes_encrypt(key.to_string(), iv.to_string(), data.to_string()).unwrap();
        assert_eq!(res, "Y9sxkD7SXOkcsYw0uXssiw==".to_string());
    }

    #[test]
    fn test_op_crypto_aes_decrypt() {
        let key = "01234567890123456789012345678901";
        let iv = "0123456789012345";
        let data = "Y9sxkD7SXOkcsYw0uXssiw==";
        let res = crypto_aes_decrypt(key.to_string(), iv.to_string(), data.to_string()).unwrap();
        assert_eq!(res, "hello world".to_string());
    }

    #[test]
    fn test_op_crypto_rsa_encrypt() {
        let key = "-----BEGIN RSA PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkDgS+sgnzMqpFIhf0GGc
GaEI344wJ8Q7oH/rz5psYPsU5AdLlQl3D4J6kX/mzRNWZHiAUig3HkE4PEep9Avl
3roIkKXcpDh+3dd2FXX5IfYl0jD+4zzt9j3BWFJfffF0bt0HZ/NQWogjE8U7Ou1h
ZgQmkTamsuCozPtlpzpFeOnv7muEtjGaJT6o04xaExYRUb4EyI8eDnX6cPzyKExP
MltOxpdSB85CRL1AWjbJS/6m4hspvuGBY5Sc/aJCeKyRNe06lBAUxllf0J2bkTt0
KjcH7EyM4AMKX6108LZaouWQJWq+blMHe8UQ7zUX4NnR6iMrs44HYjhzC4wMQVTn
GwIDAQAB";
        let data = "hello world";
        let res = crypto_rsa_encrypt(key.to_string(), data.to_string()).unwrap();
        assert_eq!(res, "Y9sxkD7SXOkcsYw0uXssiw==".to_string());
    }
}
