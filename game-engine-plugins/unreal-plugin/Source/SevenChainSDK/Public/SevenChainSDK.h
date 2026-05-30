// Copyright Seven Protocol. All Rights Reserved.
// Seven Chain Gaming SDK for Unreal Engine (Chain ID 70007)
#pragma once
#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Http.h"
#include "SevenChainSDK.generated.h"

USTRUCT(BlueprintType)
struct FSevenGameSession { GENERATED_BODY()
  UPROPERTY(BlueprintReadOnly) FString SessionId;
  UPROPERTY(BlueprintReadOnly) FString PlayerName;
  UPROPERTY(BlueprintReadOnly) FString DemoWallet;
  UPROPERTY(BlueprintReadOnly) int32 ChainId = 70007;
};

USTRUCT(BlueprintType)
struct FSevenGameTx { GENERATED_BODY()
  UPROPERTY(BlueprintReadOnly) FString TxHash;
  UPROPERTY(BlueprintReadOnly) int64 BlockNumber = 0;
  UPROPERTY(BlueprintReadOnly) bool bConfirmed = false;
  UPROPERTY(BlueprintReadOnly) int32 ConfirmationMs = 0;
  UPROPERTY(BlueprintReadOnly) int32 Points = 0;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSevenSessionCreated, FSevenGameSession, Session);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSevenTxConfirmed, FSevenGameTx, Tx);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSevenError, FString, ErrorMessage);

/**
 * USevenChainSDK - Unreal Engine Game Instance Subsystem for Seven Chain (Chain ID 70007).
 *
 * Setup:
 *   auto* SDK = GetGameInstance()->GetSubsystem<USevenChainSDK>();
 *   SDK->OnSessionCreated.AddDynamic(this, &AMyMode::OnReady);
 *   SDK->OnTxConfirmed.AddDynamic(this, &AMyHUD::ShowTx);
 *   SDK->CreateSession("Player1");
 *
 * On kill: SDK->RecordKill(10);
 * On game over: SDK->SubmitScore();
 */
UCLASS(Blueprintable, BlueprintType)
class SEVENCHAINSDK_API USevenChainSDK : public UGameInstanceSubsystem
{
  GENERATED_BODY()
public:
  UPROPERTY(BlueprintAssignable) FOnSevenSessionCreated OnSessionCreated;
  UPROPERTY(BlueprintAssignable) FOnSevenTxConfirmed OnTxConfirmed;
  UPROPERTY(BlueprintAssignable) FOnSevenError OnError;

  UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category="Seven Chain")
  FString BaseUrl = TEXT("https://theseven.meme");

  UFUNCTION(BlueprintCallable, Category="Seven Chain") void CreateSession(const FString& PlayerName);
  UFUNCTION(BlueprintCallable, Category="Seven Chain") void RecordKill(int32 Points = 10);
  UFUNCTION(BlueprintCallable, Category="Seven Chain") void RecordAction(const FString& ActionType, int32 Points);
  UFUNCTION(BlueprintCallable, Category="Seven Chain") void SubmitScore();
  UFUNCTION(BlueprintPure,     Category="Seven Chain") FSevenGameSession GetSession() const { return CurrentSession; }

private:
  FSevenGameSession CurrentSession;
  void PostRequest(const FString& Path, const FString& Body, TFunction<void(const FString&)> OnSuccess);
};