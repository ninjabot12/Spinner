/**
 * ResultModal Component
 * Displays prize reward and context-appropriate CTA (copy code, add to library, etc.).
 */

import React, { useEffect, useRef, useState } from 'react';
import { Prize, RewardType, ClaimResult } from './types';
import * as mockApi from './mockApi';
import styles from './styles.module.css';

interface ResultModalProps {
  isOpen: boolean;
  prize: Prize | null;
  playId: string | null;
  onClose: () => void;
  onClaim: (result: ClaimResult) => void;
}

interface CtaConfig {
  label: string;
  onAction: (prize: Prize, playId: string) => Promise<ClaimResult>;
  successMessage?: string;
}

/**
 * Maps reward type to CTA config (label, action, success message).
 */
const CTA_MAP: Record<RewardType, CtaConfig> = {
  loyalty_points: {
    label: 'Add Points',
    onAction: async (prize, playId) => {
      return mockApi.claim(playId, prize);
    },
    successMessage: 'Points added to your account!',
  },
  discount_percent: {
    label: 'Reveal Code',
    onAction: async (prize, playId) => {
      return mockApi.claim(playId, prize);
    },
    successMessage: 'Code copied to clipboard!',
  },
  discount_fixed: {
    label: 'Reveal Code',
    onAction: async (prize, playId) => {
      return mockApi.claim(playId, prize);
    },
    successMessage: 'Code copied to clipboard!',
  },
  free_product: {
    label: 'Add to Library',
    onAction: async (prize, playId) => {
      return mockApi.claim(playId, prize);
    },
    successMessage: 'Product added to your library!',
  },
  free_oneshot: {
    label: 'Add to Library',
    onAction: async (prize, playId) => {
      return mockApi.claim(playId, prize);
    },
    successMessage: 'Sample added to your library!',
  },
  vst_voucher: {
    label: 'Reveal Code',
    onAction: async (prize, playId) => {
      return mockApi.claim(playId, prize);
    },
    successMessage: 'Code copied to clipboard!',
  },
};

/**
 * Result modal with reward details and CTA button.
 * Accessible: focus restored on close, proper ARIA labels.
 */
export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  prize,
  playId,
  onClose,
  onClaim,
}) => {
  const [claimed, setClaimed] = useState(false);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHoveringTop, setIsHoveringTop] = useState(false);
  const [backgroundClicked, setBackgroundClicked] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverZoneRef = useRef<HTMLDivElement>(null);

  // Restore focus on close
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setClaimed(false);
      setClaimResult(null);
      setError(null);
      setIsHoveringTop(false);
      setBackgroundClicked(false);
    }
  }, [isOpen]);

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !prize || !playId) return null;

  const ctaConfig = CTA_MAP[prize.rewardType];

  const handleClaim = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await ctaConfig.onAction(prize, playId);

      if (result.success) {
        setClaimResult(result);
        setClaimed(true);
        onClaim(result);

        // Copy code to clipboard if present
        if (result.couponCode) {
          navigator.clipboard.writeText(result.couponCode).catch(() => {
            console.log('Failed to copy code');
          });
        }
      } else {
        setError('Failed to claim prize. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundClick = () => {
    // Animate the background click
    setBackgroundClicked(true);

    // Navigate to product page after animation
    setTimeout(() => {
      // Assuming product URLs follow a pattern like /products/{slug}
      // You can adjust this based on your actual routing
      const productSlug = prize.id || prize.name.toLowerCase().replace(/\s+/g, '-');
      window.location.href = `/products/${productSlug}`;
    }, 300);
  };

  const rarityColors: Record<string, string> = {
    common: '#999',
    rare: '#ff6347',
    epic: '#00ced1',
    legendary: '#ffd700',
  };

  const rarityColor = rarityColors[prize.rarity] || '#999';

  // Get cover art image URL
  // For CSS backgroundImage, we need to encode the URL properly
  const getCoverArtUrl = () => {
    if (prize.imageFileName) {
      // Encode only the filename part for use in CSS url()
      const encodedFileName = encodeURIComponent(prize.imageFileName);
      return `/prizes/${encodedFileName}`;
    }
    return '/prizes/default.webp';
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={`${styles.modalContent} ${backgroundClicked ? styles.modalContentClicked : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          backgroundImage: `url(${getCoverArtUrl()})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Invisible hover zone at the top for triggering background reveal */}
        <div
          ref={hoverZoneRef}
          onMouseEnter={() => setIsHoveringTop(true)}
          onMouseLeave={() => setIsHoveringTop(false)}
          onClick={isHoveringTop ? handleBackgroundClick : undefined}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '150px', // Fixed height hover zone at top
            zIndex: 1000,
            cursor: isHoveringTop ? 'pointer' : 'default',
          }}
        >
          {/* Show hint when hovering */}
          {isHoveringTop && (
            <div
              style={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 16px',
                background: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '20px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '500',
                animation: 'fadeIn 0.3s ease',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Click to view product →
            </div>
          )}
        </div>

        {/* Glass pane overlay for content - covers entire modal */}
        <div
          className={styles.glassPane}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '1rem',
            opacity: isHoveringTop ? 0.1 : 1,
            transition: 'opacity 0.5s ease-in-out',
            pointerEvents: isHoveringTop ? 'none' : 'auto',
          }}
        >
          {/* You Won header */}
          <div className={styles.winHeader}>
            <h2 className={styles.modalTitle} id="modal-title">
              You Won!
            </h2>
          </div>

          {/* Product Info */}
          <div className={styles.productInfo}>
            <h3 className={styles.productName}>{prize.name}</h3>
            <div className={styles.modalRarity} style={{ '--rarity-color': rarityColor } as React.CSSProperties}>
              {prize.rarity.toUpperCase()}
            </div>
          </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {!claimed ? (
            <>
              {/* Reward value display */}
              <div className={styles.modalValue}>
                <div className={styles.modalValueLabel}>
                  {prize.rewardType === 'loyalty_points' && 'Points'}
                  {prize.rewardType === 'discount_percent' && 'Discount'}
                  {prize.rewardType === 'discount_fixed' && 'Discount'}
                  {prize.rewardType === 'free_product' && 'Free Product'}
                  {prize.rewardType === 'free_oneshot' && 'Sample'}
                  {prize.rewardType === 'vst_voucher' && 'Voucher'}
                </div>
                <div className={styles.modalValueText}>
                  {prize.rewardType === 'loyalty_points' && `+${prize.value}`}
                  {prize.rewardType === 'discount_percent' && `${prize.value}% Off`}
                  {prize.rewardType === 'discount_fixed' && `$${prize.value} Off`}
                  {(prize.rewardType === 'free_product' ||
                    prize.rewardType === 'free_oneshot') &&
                    'Unlocked'}
                  {prize.rewardType === 'vst_voucher' && 'Suite Access'}
                </div>
              </div>

              {/* MSRP hint */}
              {prize.msrpCents && (
                <div style={{ fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
                  Value: ${(prize.msrpCents / 100).toFixed(2)}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Success message */}
              <div className={styles.modalSuccess}>✓ {ctaConfig.successMessage}</div>

              {/* Coupon code display (if applicable) */}
              {claimResult?.couponCode && (
                <div>
                  <div className={styles.modalValueLabel} style={{ marginBottom: '0.5rem' }}>
                    Your Code:
                  </div>
                  <div className={styles.modalCode}>{claimResult.couponCode}</div>
                  <div style={{ fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
                    Copied to clipboard!
                  </div>
                </div>
              )}

              {/* Points added message */}
              {claimResult?.pointsAdded && (
                <div style={{ textAlign: 'center', color: '#4caf50', fontWeight: '600' }}>
                  +{claimResult.pointsAdded} Points Added
                </div>
              )}

              {/* Product slug confirmation */}
              {claimResult?.grantedProductSlug && (
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: '#333',
                    textAlign: 'center',
                    marginTop: '1rem',
                  }}
                >
                  <strong>{claimResult.grantedProductSlug}</strong> is now in your library.
                </div>
              )}
            </>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div style={{ color: '#ff6347', textAlign: 'center', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className={styles.modalActions}>
          {!claimed ? (
            <>
              <button
                className={`${styles.buttonAction} ${styles.buttonCta}`}
                onClick={handleClaim}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Claiming...' : ctaConfig.label}
              </button>
              <button
                className={`${styles.buttonAction} ${styles.buttonClose}`}
                onClick={onClose}
                disabled={loading}
              >
                Close
              </button>
            </>
          ) : (
            <button
              className={`${styles.buttonAction} ${styles.buttonClose}`}
              onClick={onClose}
            >
                Done
              </button>
          )}
        </div>

        {/* Follow-up links */}
        {claimed && (
          <div className={styles.modalLinks}>
            <a href="#library" className={styles.modalLink}>
              View Library
            </a>
            <span style={{ color: '#ddd' }}>·</span>
            <a href="#checkout" className={styles.modalLink}>
              Continue Shopping
            </a>
          </div>
        )}
        </div>
        {/* End glass pane */}
      </div>
    </div>
  );
};
